import { env } from "@/config/env";
import { ApiError, parseApiError, wrapFetchFailure } from "./errors";

const REQUEST_TIMEOUT_MS = 60_000;

function withTimeout(signal?: AbortSignal | null): {
  signal: AbortSignal;
  cancel: () => void;
  didTimeout: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
    didTimeout: () => timedOut,
  };
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${env.apiBaseUrl}${normalized}`;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  parseJson?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestId = newRequestId();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Request-ID", requestId);
  if (env.apiKey) {
    headers.set("X-API-Key", env.apiKey);
  }
  if (env.skipNgrokWarning) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const timeout = withTimeout(options.signal);
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers,
      body,
      signal: timeout.signal,
    });
  } catch (error) {
    if (options.signal?.aborted && !timeout.didTimeout()) throw error;
    throw wrapFetchFailure(error, requestId);
  } finally {
    timeout.cancel();
  }

  const responseId = response.headers.get("X-Request-ID") ?? requestId;

  if (!response.ok) {
    let payload: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    try {
      payload = contentType.includes("json") ? await response.json() : await response.text();
    } catch {
      payload = undefined;
    }
    if (typeof payload === "string") {
      throw parseApiError(response.status, { detail: payload }, responseId);
    }
    throw parseApiError(response.status, payload, responseId);
  }

  if (response.status === 204 || options.parseJson === false) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const requestId = newRequestId();
  const headers = new Headers();
  headers.set("Accept", "*/*");
  headers.set("X-Request-ID", requestId);
  if (env.apiKey) headers.set("X-API-Key", env.apiKey);
  if (env.skipNgrokWarning) headers.set("ngrok-skip-browser-warning", "true");
  const timeout = withTimeout();
  let response: Response;
  try {
    response = await fetch(apiUrl(path), { headers, signal: timeout.signal });
  } catch (error) {
    throw wrapFetchFailure(error, requestId);
  } finally {
    timeout.cancel();
  }
  const responseId = response.headers.get("X-Request-ID") ?? requestId;
  if (!response.ok) {
    let payload: unknown;
    try {
      const contentType = response.headers.get("content-type") ?? "";
      payload = contentType.includes("json") ? await response.json() : await response.text();
    } catch {
      payload = undefined;
    }
    if (typeof payload === "string") {
      throw parseApiError(response.status, { detail: payload }, responseId);
    }
    throw parseApiError(response.status, payload, responseId);
  }
  return response.blob();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: "POST", body }),
  getBlob: (path: string) => requestBlob(path),
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
