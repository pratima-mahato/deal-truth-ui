import type { HubSpotOperation, HubSpotRequest, HubSpotResponse, MockIntegrationScenario, OperationResult } from "./contracts";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function detectMockScenario(request: HubSpotRequest): MockIntegrationScenario {
  const hay = `${request.requestId} ${JSON.stringify(request)}`;
  if (hay.includes("__FAIL_ALL__") || request.requestId.startsWith("fail-")) return "fail";
  if (hay.includes("__SLACK_FAIL__") || request.requestId.startsWith("slack-fail-")) return "slack-fail";
  if (hay.includes("__PARTIAL__") || request.requestId.startsWith("partial-")) return "partial";
  return "success";
}

function entityUrl(type: HubSpotOperation["type"], id: string): string {
  const path =
    type === "CREATE_DEAL"
      ? "deal"
      : type === "CREATE_TASK"
        ? "task"
        : type === "CREATE_NOTE"
          ? "note"
          : type === "CREATE_MEETING"
            ? "meeting"
            : "call";
  return `https://app.hubspot.com/contacts/demo/${path}/${id}`;
}

function successResult(op: HubSpotOperation): OperationResult {
  const externalId = `hs-${op.operationId.slice(-8)}`;
  return {
    operationId: op.operationId,
    type: op.type,
    status: "SUCCESS",
    externalId,
    entityUrl: entityUrl(op.type, externalId),
    fields: { type: op.type },
  };
}

function failedResult(op: HubSpotOperation, message: string): OperationResult {
  return {
    operationId: op.operationId,
    type: op.type,
    status: "FAILED",
    error: { code: "OPERATION_FAILED", message },
  };
}

export async function mockIntegrationHealth(): Promise<{ status: string }> {
  await delay(180);
  return { status: "ok" };
}

export async function mockExecuteHubSpot(request: HubSpotRequest): Promise<HubSpotResponse> {
  await delay(420);
  const scenario = detectMockScenario(request);
  const operations = request.operations.map((op) => {
    if (scenario === "fail") return failedResult(op, "The integration service could not create this record.");
    if (scenario === "partial" && op.type === "CREATE_TASK") {
      return failedResult(op, "Could not create task.");
    }
    return successResult(op);
  });

  const succeeded = operations.filter((op) => op.status === "SUCCESS").length;
  const failed = operations.filter((op) => op.status === "FAILED").length;
  const status = failed === 0 ? "SUCCESS" : succeeded === 0 ? "FAILED" : "PARTIAL";

  const slackEnabled = Boolean(request.slack?.enabled);
  const slack =
    !slackEnabled
      ? { status: "SKIPPED" as const, message: "Slack notification was not requested." }
      : scenario === "slack-fail"
        ? { status: "FAILED" as const, message: "Slack notification failed. CRM records were not rolled back." }
        : scenario === "fail"
          ? { status: "SKIPPED" as const, message: "Slack was skipped because no CRM action succeeded." }
          : { status: "SUCCESS" as const, message: "Slack notification sent." };

  return { requestId: request.requestId, status, operations, slack };
}
