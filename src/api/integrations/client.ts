import { env } from "@/config/env";
import { parseApiError, wrapFetchFailure } from "@/api/errors";

const REQUEST_TIMEOUT_MS = 60_000;

function withTimeout(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}

function integrationUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${env.integrationApiBaseUrl}${normalized}`;
}

function applyIntegrationAuth(headers: Headers): void {
  const token = env.integrationApiToken.trim();
  if (!token) return;
  headers.set("Authorization", `Bearer ${token}`);
}

async function integrationRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const timeout = withTimeout();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  applyIntegrationAuth(headers);
  if (env.skipNgrokWarning) {
    headers.set("ngrok-skip-browser-warning", "true");
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(integrationUrl(path), {
      ...options,
      headers,
      signal: timeout.signal,
    });
  } catch (error) {
    throw wrapFetchFailure(error);
  } finally {
    timeout.cancel();
  }

  if (!response.ok) {
    let payload: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    try {
      payload = contentType.includes("json") ? await response.json() : await response.text();
    } catch {
      payload = undefined;
    }
    if (typeof payload === "string") {
      throw parseApiError(response.status, { detail: payload });
    }
    throw parseApiError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const integrationHttp = {
  get: <T>(path: string) => integrationRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    integrationRequest<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
};
