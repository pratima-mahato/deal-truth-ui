import { apiErrorSchema, type ApiErrorBody } from "./contracts";

export class ApiError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;
  readonly status: number;
  readonly requestId?: string;
  readonly failureKind?: string;

  constructor(opts: {
    code: string;
    message: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
    status: number;
    requestId?: string;
    failureKind?: string;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.retryable = opts.retryable ?? false;
    this.details = opts.details;
    this.status = opts.status;
    this.requestId = opts.requestId;
    this.failureKind = opts.failureKind;
  }
}

export function parseApiError(status: number, body: unknown, requestId?: string): ApiError {
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) {
    const err: ApiErrorBody = parsed.data;
    return new ApiError({
      code: err.error.code,
      message: err.error.message,
      retryable: err.error.retryable,
      details: err.error.details,
      status,
      requestId: err.requestId ?? requestId,
      failureKind: err.error.failureKind ?? err.error.failure_kind,
    });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  if (record && "detail" in record) {
    const detail = record.detail;
    if (typeof detail === "string") {
      return new ApiError({
        code: status === 404 ? "NOT_FOUND" : statusCode(status),
        message: detail,
        retryable: status === 429 || status >= 500,
        status,
        requestId,
      });
    }
    if (Array.isArray(detail)) {
      const message = detail
        .map((item) => {
          if (!item || typeof item !== "object") return String(item);
          const row = item as Record<string, unknown>;
          return typeof row.msg === "string" ? row.msg : JSON.stringify(item);
        })
        .filter(Boolean)
        .join("; ");
      return new ApiError({
        code: "VALIDATION_ERROR",
        message: message || "The request failed validation.",
        retryable: false,
        details: { detail },
        status,
        requestId,
      });
    }
  }
  return new ApiError({
    code: statusCode(status),
    message: statusMessage(status),
    retryable: status === 429 || status >= 500,
    status,
    requestId,
  });
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "The request was invalid.",
  401: "Authentication is required.",
  403: "You do not have access to this resource.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current call state.",
  422: "The request failed validation.",
  429: "Too many requests. Wait a moment and try again.",
  500: "The API is unavailable.",
  502: "The API gateway is unavailable.",
  503: "The API is temporarily unavailable.",
};

function statusCode(status: number): string {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL_ERROR";
  return "HTTP_ERROR";
}

function statusMessage(status: number): string {
  return STATUS_MESSAGES[status] ?? (status >= 500 ? "The API is unavailable." : "The request failed.");
}

export function wrapFetchFailure(error: unknown, requestId?: string): ApiError {
  if (error instanceof ApiError) return error;
  const name = error instanceof Error ? error.name : "";
  if (name === "AbortError") {
    return new ApiError({
      code: "TIMEOUT",
      message: "The request timed out.",
      retryable: true,
      status: 0,
      requestId,
    });
  }
  return new ApiError({
    code: "NETWORK_ERROR",
    message: "Could not reach the API. Check your connection and VITE_API_BASE_URL.",
    retryable: true,
    status: 0,
    requestId,
  });
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) {
    if (error.status === 0) return true;
    if (error.status === 429 || error.status === 502 || error.status === 503) return true;
    return false;
  }
  return false;
}
