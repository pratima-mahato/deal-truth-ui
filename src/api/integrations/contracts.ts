export const HUBSPOT_OPERATION_TYPES = [
  "CREATE_DEAL",
  "CREATE_NOTE",
  "CREATE_TASK",
  "CREATE_CALL",
  "CREATE_MEETING",
] as const;
export type HubSpotOperationType = (typeof HUBSPOT_OPERATION_TYPES)[number];

export const TASK_TYPES = ["CALL", "EMAIL", "TODO"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const SLACK_SEVERITIES = ["critical", "warning", "success", "info"] as const;
export type SlackSeverity = (typeof SLACK_SEVERITIES)[number];

export const OVERALL_STATUSES = ["SUCCESS", "PARTIAL", "FAILED"] as const;
export type OverallStatus = (typeof OVERALL_STATUSES)[number];

export const OPERATION_STATUSES = ["SUCCESS", "FAILED"] as const;
export type OperationStatus = (typeof OPERATION_STATUSES)[number];

export const SLACK_RESULT_STATUSES = ["SUCCESS", "FAILED", "SKIPPED"] as const;
export type SlackResultStatus = (typeof SLACK_RESULT_STATUSES)[number];

export type CreateDealData = {
  name: string;
  pipeline: string;
  stage: string;
  amount: number;
  closeDate: string;
};

export type CreateNoteData = {
  body: string;
  timestamp?: string;
};

export type CreateTaskData = {
  taskType: TaskType;
  dueAt: string;
  subject: string;
  body?: string;
  priority?: TaskPriority;
};

export type CreateCallData = {
  timestamp: string;
  title: string;
  body: string;
  durationMs: number;
};

export type CreateMeetingData = {
  timestamp: string;
  title: string;
  body: string;
};

export type HubSpotOperation =
  | { operationId: string; type: "CREATE_DEAL"; data: CreateDealData }
  | { operationId: string; type: "CREATE_NOTE"; data: CreateNoteData }
  | { operationId: string; type: "CREATE_TASK"; data: CreateTaskData }
  | { operationId: string; type: "CREATE_CALL"; data: CreateCallData }
  | { operationId: string; type: "CREATE_MEETING"; data: CreateMeetingData };

export type SlackEvidence = {
  quote: string;
  speaker?: string;
  timestamp?: string;
};

export type SlackChange = {
  label: string;
  before?: string;
  after?: string;
};

export type SlackRisk = {
  label: string;
  description?: string;
};

export type SlackAlert = {
  enabled: boolean;
  type: string;
  severity: SlackSeverity;
  title: string;
  account?: Record<string, unknown>;
  message?: string;
  changes?: SlackChange[];
  risks?: SlackRisk[];
  evidence?: SlackEvidence[];
  reportUrl?: string;
};

export type HubSpotRequest = {
  requestId: string;
  operations: HubSpotOperation[];
  slack?: SlackAlert;
};

export type OperationResult = {
  operationId: string;
  type?: HubSpotOperationType;
  status: OperationStatus;
  externalId?: string;
  entityUrl?: string;
  fields?: Record<string, unknown>;
  error?: { code?: string; message?: string };
};

export type SlackResult = {
  status: SlackResultStatus;
  message?: string;
};

export type HubSpotResponse = {
  requestId?: string;
  status: OverallStatus;
  operations: OperationResult[];
  slack?: SlackResult;
};

export type IntegrationHealthResponse = {
  status: string;
};

export type MockIntegrationScenario = "success" | "partial" | "fail" | "slack-fail";
