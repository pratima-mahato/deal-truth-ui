export const INTEGRATIONS_API_PREFIX = "/integrations-api";

export const HUBSPOT_OPERATION_TYPE = {
  CREATE_DEAL: "CREATE_DEAL",
  CREATE_NOTE: "CREATE_NOTE",
  CREATE_TASK: "CREATE_TASK",
  CREATE_CALL: "CREATE_CALL",
  CREATE_MEETING: "CREATE_MEETING",
} as const;

export const HUBSPOT_TASK_TYPE = {
  CALL: "CALL",
  EMAIL: "EMAIL",
  TODO: "TODO",
} as const;

export const HUBSPOT_TASK_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export const DEFAULT_HUBSPOT_PIPELINE = "default";
export const DEFAULT_HUBSPOT_STAGE = "appointmentscheduled";

export const SLACK_ALERT_TYPE = {
  DEAL_RISK: "DEAL_RISK",
  CRM_UPDATED: "CRM_UPDATED",
  CALL_PROCESSED: "CALL_PROCESSED",
  FOLLOW_UP_CREATED: "FOLLOW_UP_CREATED",
  GENERAL: "GENERAL",
} as const;

export const SLACK_SEVERITY = {
  CRITICAL: "critical",
  WARNING: "warning",
  SUCCESS: "success",
  INFO: "info",
} as const;

export const SLACK_TITLE_MAX_CHARS = 150;
export const SLACK_CHANGES_MAX = 3;
export const SLACK_RISKS_MAX = 3;
export const SLACK_EVIDENCE_MAX = 2;

export const DEFAULT_TASK_DUE_DAYS = 3;
export const MS_PER_DAY = 86_400_000;

export const HUBSPOT_HEALTH_PATH = "/health";
export const HUBSPOT_EXECUTE_PATH = "/v1/hubspot";
export const INTEGRATION_AUTH_HEADER = "Authorization";
export const INTEGRATION_AUTH_SCHEME = "Bearer";

export const FORBIDDEN_REQUEST_KEYS = [
  "webhook",
  "token",
  "apiKey",
  "api_key",
  "authorization",
  "slackWebhook",
  "privateAppToken",
  "HUBSPOT_ACCESS_TOKEN",
  "SLACK_WEBHOOK_URL",
] as const;
