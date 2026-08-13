import type {
  HubSpotOperationType,
  HubSpotResponse,
  OperationResult,
  OverallStatus,
  SlackResult,
  SlackResultStatus,
} from "./contracts";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function str(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

export function summarizeHubSpotResponse(response: HubSpotResponse): {
  succeeded: number;
  failed: number;
  total: number;
  overall: OverallStatus;
} {
  const succeeded = response.operations.filter((op) => op.status === "SUCCESS").length;
  const failed = response.operations.filter((op) => op.status === "FAILED").length;
  const total = response.operations.length;
  let overall: OverallStatus = response.status;
  if (total > 0) {
    if (failed === 0) overall = "SUCCESS";
    else if (succeeded === 0) overall = "FAILED";
    else overall = "PARTIAL";
  }
  return { succeeded, failed, total, overall };
}

export function parseHubSpotResponse(raw: unknown): HubSpotResponse {
  const obj = asRecord(raw);
  const operations = (Array.isArray(obj.operations) ? obj.operations : []).map(parseOperationResult);
  const slack = obj.slack != null ? parseSlackResult(obj.slack) : undefined;
  const statusRaw = str(obj.status).toUpperCase();
  const status: OverallStatus =
    statusRaw === "SUCCESS" || statusRaw === "PARTIAL" || statusRaw === "FAILED"
      ? statusRaw
      : summarizeHubSpotResponse({ status: "SUCCESS", operations, slack }).overall;
  return {
    requestId: str(obj.requestId || obj.request_id) || undefined,
    status,
    operations,
    slack,
  };
}

function parseOperationResult(raw: unknown): OperationResult {
  const obj = asRecord(raw);
  const type = str(obj.type).toUpperCase() as HubSpotOperationType;
  const statusRaw = str(obj.status).toUpperCase();
  const errorObj = asRecord(obj.error);
  return {
    operationId: str(obj.operationId || obj.operation_id),
    type: type || undefined,
    status: statusRaw === "FAILED" ? "FAILED" : "SUCCESS",
    externalId: str(obj.externalId || obj.external_id) || undefined,
    entityUrl: str(obj.entityUrl || obj.entity_url) || undefined,
    fields: obj.fields && typeof obj.fields === "object" ? asRecord(obj.fields) : undefined,
    error:
      obj.error == null
        ? undefined
        : {
            code: str(errorObj.code) || undefined,
            message: str(errorObj.message || obj.error) || "The operation failed.",
          },
  };
}

function parseSlackResult(raw: unknown): SlackResult {
  const obj = asRecord(raw);
  const statusRaw = str(obj.status).toUpperCase() as SlackResultStatus;
  const status: SlackResultStatus =
    statusRaw === "FAILED" || statusRaw === "SKIPPED" || statusRaw === "SUCCESS" ? statusRaw : "SKIPPED";
  return {
    status,
    message: str(obj.message) || undefined,
  };
}
