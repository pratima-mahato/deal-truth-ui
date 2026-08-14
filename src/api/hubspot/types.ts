import { z } from "zod";
import {
  HUBSPOT_OPERATION_TYPE,
  HUBSPOT_TASK_PRIORITY,
  HUBSPOT_TASK_TYPE,
  SLACK_SEVERITY,
} from "./constants";

export const hubspotOperationTypeSchema = z.enum([
  HUBSPOT_OPERATION_TYPE.CREATE_DEAL,
  HUBSPOT_OPERATION_TYPE.CREATE_NOTE,
  HUBSPOT_OPERATION_TYPE.CREATE_TASK,
  HUBSPOT_OPERATION_TYPE.CREATE_CALL,
  HUBSPOT_OPERATION_TYPE.CREATE_MEETING,
]);

export type HubspotOperationType = z.infer<typeof hubspotOperationTypeSchema>;

export const hubspotTaskTypeSchema = z.enum([
  HUBSPOT_TASK_TYPE.CALL,
  HUBSPOT_TASK_TYPE.EMAIL,
  HUBSPOT_TASK_TYPE.TODO,
]);

export type HubspotTaskType = z.infer<typeof hubspotTaskTypeSchema>;

export const hubspotTaskPrioritySchema = z.enum([
  HUBSPOT_TASK_PRIORITY.LOW,
  HUBSPOT_TASK_PRIORITY.MEDIUM,
  HUBSPOT_TASK_PRIORITY.HIGH,
]);

export type HubspotTaskPriority = z.infer<typeof hubspotTaskPrioritySchema>;

export const createDealDataSchema = z.object({
  name: z.string().min(1),
  pipeline: z.string().min(1),
  stage: z.string().min(1),
  amount: z.number(),
  closeDate: z.string().min(1),
});

export const createNoteDataSchema = z.object({
  body: z.string().min(1),
  timestamp: z.string().optional(),
});

export const createTaskDataSchema = z.object({
  taskType: hubspotTaskTypeSchema,
  dueAt: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().optional(),
  priority: hubspotTaskPrioritySchema.optional(),
});

export const createCallDataSchema = z.object({
  timestamp: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  durationMs: z.number().int().min(0),
});

export const createMeetingDataSchema = z.object({
  timestamp: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const hubspotOperationSchema = z.discriminatedUnion("type", [
  z.object({
    operationId: z.string().min(1),
    type: z.literal(HUBSPOT_OPERATION_TYPE.CREATE_DEAL),
    data: createDealDataSchema,
  }),
  z.object({
    operationId: z.string().min(1),
    type: z.literal(HUBSPOT_OPERATION_TYPE.CREATE_NOTE),
    data: createNoteDataSchema,
  }),
  z.object({
    operationId: z.string().min(1),
    type: z.literal(HUBSPOT_OPERATION_TYPE.CREATE_TASK),
    data: createTaskDataSchema,
  }),
  z.object({
    operationId: z.string().min(1),
    type: z.literal(HUBSPOT_OPERATION_TYPE.CREATE_CALL),
    data: createCallDataSchema,
  }),
  z.object({
    operationId: z.string().min(1),
    type: z.literal(HUBSPOT_OPERATION_TYPE.CREATE_MEETING),
    data: createMeetingDataSchema,
  }),
]);

export type HubspotOperation = z.infer<typeof hubspotOperationSchema>;

export const slackChangeSchema = z.object({
  label: z.string().min(1),
  before: z.string().optional(),
  after: z.string().optional(),
});

export const slackRiskSchema = z.object({
  label: z.string().optional(),
  description: z.string().min(1),
});

export const slackEvidenceSchema = z.object({
  quote: z.string().min(1),
  speaker: z.string().optional(),
  timestamp: z.string().optional(),
});

export const slackAccountSchema = z.object({
  name: z.string().optional(),
  dealName: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
});

export const slackAlertSchema = z
  .object({
    enabled: z.boolean(),
    title: z.string().min(1).optional(),
    type: z.string().optional(),
    severity: z
      .enum([SLACK_SEVERITY.CRITICAL, SLACK_SEVERITY.WARNING, SLACK_SEVERITY.SUCCESS, SLACK_SEVERITY.INFO])
      .optional(),
    message: z.string().optional(),
    account: slackAccountSchema.optional(),
    changes: z.array(slackChangeSchema).optional(),
    risks: z.array(slackRiskSchema).optional(),
    evidence: z.array(slackEvidenceSchema).optional(),
    reportUrl: z.string().url().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.enabled && !value.title?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "title is required when Slack is enabled" });
    }
  });

export type SlackAlert = z.infer<typeof slackAlertSchema>;

export const hubspotSyncRequestSchema = z.object({
  requestId: z.string().min(1),
  operations: z.array(hubspotOperationSchema).min(1),
  slack: slackAlertSchema.optional(),
});

export type HubspotSyncRequest = z.infer<typeof hubspotSyncRequestSchema>;

export const hubspotOperationResultSchema = z.object({
  operationId: z.string(),
  type: hubspotOperationTypeSchema,
  status: z.enum(["SUCCESS", "FAILED"]),
  externalId: z.string().optional(),
  entityUrl: z.string().optional(),
  fields: z.record(z.unknown()).optional(),
  errorCode: z.string().optional(),
});

export type HubspotOperationResult = z.infer<typeof hubspotOperationResultSchema>;

export const slackResultSchema = z.object({
  status: z.enum(["SUCCESS", "FAILED", "SKIPPED"]),
  errorCode: z.string().optional(),
});

export type SlackResult = z.infer<typeof slackResultSchema>;

export const hubspotSyncResponseSchema = z.object({
  requestId: z.string(),
  status: z.enum(["SUCCESS", "PARTIAL", "FAILED"]),
  operations: z.array(hubspotOperationResultSchema),
  slack: slackResultSchema,
});

export type HubspotSyncResponse = z.infer<typeof hubspotSyncResponseSchema>;

const connectionHintSchema = z
  .object({
    connected: z.boolean().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export const hubspotHealthSchema = z
  .object({
    status: z.string().min(1),
    operations: z.array(z.string()).optional(),
    hubspot: connectionHintSchema.optional(),
    slack: connectionHintSchema.optional(),
  })
  .passthrough();

export type HubspotHealth = z.infer<typeof hubspotHealthSchema>;

export const hubspotValidationErrorSchema = z.object({
  errorCode: z.literal("INVALID_REQUEST"),
  message: z.string(),
});
