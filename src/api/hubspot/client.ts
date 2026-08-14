import { env } from "@/config/env";
import { ApiError, wrapFetchFailure } from "../errors";
import {
  FORBIDDEN_REQUEST_KEYS,
  HUBSPOT_EXECUTE_PATH,
  HUBSPOT_HEALTH_PATH,
  INTEGRATION_AUTH_HEADER,
  INTEGRATION_AUTH_SCHEME,
  INTEGRATIONS_API_PREFIX,
} from "./constants";
import {
  hubspotHealthSchema,
  hubspotSyncRequestSchema,
  hubspotSyncResponseSchema,
  hubspotValidationErrorSchema,
  type HubspotHealth,
  type HubspotSyncRequest,
  type HubspotSyncResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 60_000;

export function integrationApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (env.integrationApiBaseUrl) return `${env.integrationApiBaseUrl}${normalized}`;
  return `${INTEGRATIONS_API_PREFIX}${normalized}`;
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dealtruth-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function assertNoSecrets(value: unknown, path = "request"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecrets(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    const forbidden = FORBIDDEN_REQUEST_KEYS.some((name) => name.toLowerCase() === key.toLowerCase());
    if (forbidden) {
      throw new ApiError({
        code: "INVALID_REQUEST",
        message: "Integration requests must not include credentials or webhooks.",
        status: 400,
      });
    }
    assertNoSecrets(nested, `${path}.${key}`);
  }
}

function applyIntegrationAuth(headers: Headers): void {
  const token = env.integrationApiToken.trim();
  if (!token) return;
  headers.set(INTEGRATION_AUTH_HEADER, `${INTEGRATION_AUTH_SCHEME} ${token}`);
}

async function integrationsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  applyIntegrationAuth(headers);
  if (env.skipNgrokWarning) {
    headers.set("ngrok-skip-browser-warning", "true");
  }
  try {
    return await fetch(integrationApiUrl(path), {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    const wrapped = wrapFetchFailure(error);
    throw new ApiError({
      code: wrapped.code,
      message: "Could not reach the HubSpot integration service.",
      retryable: wrapped.retryable,
      status: wrapped.status,
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseFailure(status: number, payload: unknown): ApiError {
  const invalid = hubspotValidationErrorSchema.safeParse(payload);
  if (invalid.success) {
    return new ApiError({
      code: invalid.data.errorCode,
      message: invalid.data.message,
      status,
    });
  }
  if (status === 401 || status === 403) {
    return new ApiError({
      code: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      message: "The integration API token was rejected. Set VITE_INTEGRATION_API_TOKEN in .env.",
      status,
    });
  }
  return new ApiError({
    code: status >= 500 ? "INTERNAL_ERROR" : "HTTP_ERROR",
    message: status >= 500 ? "The integration service is unavailable." : "The integration request failed.",
    status,
    retryable: status === 429 || status >= 500,
  });
}

export async function getHubspotHealth(): Promise<HubspotHealth> {
  const response = await integrationsFetch(HUBSPOT_HEALTH_PATH);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (!response.ok) throw parseFailure(response.status, payload);
  return hubspotHealthSchema.parse(payload);
}

export async function executeHubspotSync(input: Omit<HubspotSyncRequest, "requestId"> & { requestId?: string }): Promise<HubspotSyncResponse> {
  const request: HubspotSyncRequest = hubspotSyncRequestSchema.parse({
    ...input,
    requestId: input.requestId?.trim() || newRequestId(),
  });
  assertNoSecrets(request);

  const response = await integrationsFetch(HUBSPOT_EXECUTE_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  if (!response.ok) throw parseFailure(response.status, payload);
  return hubspotSyncResponseSchema.parse(payload);
}
