import type { CallReport, Commitment, DealRisk, Transcript } from "@/api/contracts";
import { resolveSegment } from "@/lib/evidence";
import { formatClock } from "@/lib/utils";
import {
  DEFAULT_HUBSPOT_PIPELINE,
  DEFAULT_HUBSPOT_STAGE,
  DEFAULT_TASK_DUE_DAYS,
  HUBSPOT_OPERATION_TYPE,
  HUBSPOT_TASK_PRIORITY,
  HUBSPOT_TASK_TYPE,
  MS_PER_DAY,
  SLACK_ALERT_TYPE,
  SLACK_CHANGES_MAX,
  SLACK_EVIDENCE_MAX,
  SLACK_RISKS_MAX,
  SLACK_SEVERITY,
  SLACK_TITLE_MAX_CHARS,
} from "@/api/hubspot/constants";
import type {
  HubspotOperation,
  HubspotTaskPriority,
  HubspotTaskType,
  SlackAlert,
} from "@/api/hubspot/types";

export type ActionState = "SUPPORTED" | "MANUAL" | "BLOCKED";

export type ProposedCrmAction = {
  id: string;
  operationId: string;
  type: (typeof HUBSPOT_OPERATION_TYPE)[keyof typeof HUBSPOT_OPERATION_TYPE];
  state: ActionState;
  label: string;
  value: string;
  reason: string;
  segmentId?: string;
  defaultSelected: boolean;
  operation?: HubspotOperation;
};

export type ProposedSlackAction = {
  id: "slack";
  state: "SUPPORTED";
  label: string;
  value: string;
  reason: string;
  defaultSelected: boolean;
  slack: SlackAlert;
};

export type ProposedIntegrations = {
  accountName: string;
  contactName: string;
  dealName: string;
  crmActions: ProposedCrmAction[];
  slack: ProposedSlackAction;
};

const CUSTOMER_NAME_SEPARATOR = "·";
const MEETING_PATTERN = /meeting/i;
const EMAIL_TASK_PATTERN = /email|send|docs?|documentation|pack|share|mapping/i;
const CALL_TASK_PATTERN = /call|intro|phone/i;
const HIGH_PRIORITY_PATTERN = /security|soc2|blocker|competitor/i;
const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function splitCustomerName(raw: string): { contactName: string; accountName: string } {
  const parts = raw
    .split(CUSTOMER_NAME_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { contactName: parts[0], accountName: parts.slice(1).join(" · ") };
  }
  const fallback = raw.trim() || "Unknown account";
  return { contactName: fallback, accountName: fallback };
}

function parseTimestamp(iso: string | undefined): Date {
  if (!iso) return new Date();
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toDateTime(date: Date): string {
  return date.toISOString();
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

function nextWeekday(from: Date, weekday: number): Date {
  const current = from.getUTCDay();
  const delta = weekday - current;
  if (delta < 0) return addDays(from, delta + 7);
  return addDays(from, delta);
}

export function parseDueAt(dueText: string | undefined, fromIso: string): string {
  const from = parseTimestamp(fromIso);
  const text = (dueText ?? "").trim().toLowerCase();
  if (!text) return toDateTime(addDays(from, DEFAULT_TASK_DUE_DAYS));
  if (text.includes("tomorrow")) return toDateTime(addDays(from, 1));
  if (text.includes("today")) return toDateTime(from);
  if (text.includes("next week")) return toDateTime(addDays(from, 7));
  for (const [name, index] of Object.entries(WEEKDAY_INDEX)) {
    if (text.includes(name)) return toDateTime(nextWeekday(from, index));
  }
  const isoDate = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoDate) {
    const parsed = new Date(`${isoDate[0]}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return toDateTime(parsed);
  }
  return toDateTime(addDays(from, DEFAULT_TASK_DUE_DAYS));
}

export function inferTaskType(action: string): HubspotTaskType {
  if (EMAIL_TASK_PATTERN.test(action)) return HUBSPOT_TASK_TYPE.EMAIL;
  if (CALL_TASK_PATTERN.test(action)) return HUBSPOT_TASK_TYPE.CALL;
  return HUBSPOT_TASK_TYPE.TODO;
}

function inferTaskPriority(action: string): HubspotTaskPriority {
  return HIGH_PRIORITY_PATTERN.test(action) ? HUBSPOT_TASK_PRIORITY.HIGH : HUBSPOT_TASK_PRIORITY.MEDIUM;
}

function firstSegment(ids: string[] | undefined): string | undefined {
  return ids?.find(Boolean);
}

function bulletList(label: string, items: string[]): string[] {
  if (!items.length) return [];
  return ["", `${label}:`, ...items.map((item) => `- ${item}`)];
}

function buildCallNote(report: CallReport): string {
  return [
    `DealTruth summary: ${report.summary.headline}`,
    "",
    report.summary.tldr,
    ...bulletList("Decisions", report.summary.decisions),
    ...bulletList("Action items", report.summary.actionItems),
    ...bulletList("Next steps", report.summary.nextSteps),
    "",
    `Why they buy: ${report.managerBrief.whyTheyBuy}`,
    `Biggest risk: ${report.managerBrief.biggestRisk}`,
    `Next move: ${report.managerBrief.nextMove}`,
  ]
    .join("\n")
    .trim();
}

function buildCallBody(report: CallReport): string {
  const decisions = report.summary.decisions.length
    ? `\n\nDecisions:\n${report.summary.decisions.map((item) => `- ${item}`).join("\n")}`
    : "";
  return `${report.summary.tldr}${decisions}`.trim();
}

function nextMeetingWasRefused(report: CallReport): { refused: boolean; segmentId?: string; reason: string } {
  const meeting = report.commitments.find((item) => MEETING_PATTERN.test(item.action) && item.status === "not_committed");
  const signal = report.dealSignals.find((item) => item.id === "next_meeting" && item.state === "missing");
  if (meeting || signal) {
    return {
      refused: true,
      segmentId: firstSegment(meeting?.evidence.segmentIds) ?? firstSegment(report.realityChecks[1]?.customerEvidence.segmentIds),
      reason: "The customer refused to commit to a next meeting. Writing one would create a commitment that does not exist.",
    };
  }
  return { refused: false, reason: "" };
}

function sellerTasks(report: CallReport): Commitment[] {
  return report.commitments.filter((item) => item.side === "seller" && item.status === "committed");
}

function supportedRisks(report: CallReport): DealRisk[] {
  return [...report.risks]
    .filter((risk) => risk.evidenceStatus === "SUPPORTED")
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.severity] - rank[b.severity];
    });
}

function truncateTitle(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= SLACK_TITLE_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, SLACK_TITLE_MAX_CHARS - 1).trimEnd()}…`;
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function proposeIntegrations(
  report: CallReport,
  options: { reportUrl?: string; transcript?: Transcript } = {},
): ProposedIntegrations {
  const { contactName, accountName } = splitCustomerName(report.call.customerName);
  const dealName = report.managerBrief.dealLabel.trim() || `${accountName} · ${report.call.title}`;
  const happenedAt = toDateTime(parseTimestamp(report.call.completedAt ?? report.call.createdAt));
  const durationMs = Math.max(0, Math.round(report.call.durationMs ?? 0));
  const pain = report.customerTruth.find((fact) => fact.category === "pain");
  const blocker = report.customerTruth.find((fact) => fact.category === "blocker");
  const meetingGate = nextMeetingWasRefused(report);
  const noteBody = buildCallNote(report);
  const callBody = buildCallBody(report);
  const callTitle = `${accountName} ${report.call.title}`.trim();

  const crmActions: ProposedCrmAction[] = [
    {
      id: "note",
      operationId: "note_summary",
      type: HUBSPOT_OPERATION_TYPE.CREATE_NOTE,
      state: "SUPPORTED",
      label: "Write call notes",
      value: noteBody,
      reason: "Verified summary, decisions, and the biggest risk from the transcript.",
      segmentId: firstSegment(pain?.evidence.segmentIds),
      defaultSelected: true,
      operation: {
        operationId: "note_summary",
        type: HUBSPOT_OPERATION_TYPE.CREATE_NOTE,
        data: { body: noteBody, timestamp: happenedAt },
      },
    },
    ...sellerTasks(report).map((task, index) => {
      const operationId = `task_${task.id}`;
      const dueAt = parseDueAt(task.dueText, report.call.createdAt);
      const taskType = inferTaskType(task.action);
      const priority = inferTaskPriority(task.action);
      const body = `${task.owner} committed to this on the call${task.dueText ? ` (${task.dueText})` : ""}.`;
      return {
        id: operationId,
        operationId,
        type: HUBSPOT_OPERATION_TYPE.CREATE_TASK,
        state: "SUPPORTED" as const,
        label: `Follow-up task ${index + 1}`,
        value: task.action,
        reason: "Seller commitment with a date in the transcript.",
        segmentId: firstSegment(task.evidence.segmentIds),
        defaultSelected: true,
        operation: {
          operationId,
          type: HUBSPOT_OPERATION_TYPE.CREATE_TASK,
          data: {
            taskType,
            dueAt,
            subject: task.action,
            body,
            priority,
          },
        },
      };
    }),
    {
      id: "call",
      operationId: "call_log",
      type: HUBSPOT_OPERATION_TYPE.CREATE_CALL,
      state: "SUPPORTED",
      label: "Log the completed call",
      value: callTitle,
      reason: "The recording exists. This logs the completed activity, not a future meeting.",
      segmentId: firstSegment(pain?.evidence.segmentIds),
      defaultSelected: true,
      operation: {
        operationId: "call_log",
        type: HUBSPOT_OPERATION_TYPE.CREATE_CALL,
        data: {
          timestamp: happenedAt,
          title: callTitle,
          body: callBody,
          durationMs,
        },
      },
    },
    {
      id: "deal",
      operationId: "deal_1",
      type: HUBSPOT_OPERATION_TYPE.CREATE_DEAL,
      state: "MANUAL",
      label: "Create HubSpot deal",
      value: "",
      reason:
        "Amount, pipeline, stage, and close date are not knowable from this call. Enter them only if you want a new deal created.",
      segmentId: firstSegment(blocker?.evidence.segmentIds),
      defaultSelected: false,
    },
    {
      id: "meeting",
      operationId: "meeting_1",
      type: HUBSPOT_OPERATION_TYPE.CREATE_MEETING,
      state: meetingGate.refused ? "BLOCKED" : "SUPPORTED",
      label: "Log completed meeting",
      value: "",
      reason: meetingGate.refused
        ? meetingGate.reason
        : "This call can be logged as a completed meeting.",
      segmentId: meetingGate.segmentId,
      defaultSelected: false,
      operation: meetingGate.refused
        ? undefined
        : {
            operationId: "meeting_1",
            type: HUBSPOT_OPERATION_TYPE.CREATE_MEETING,
            data: {
              timestamp: happenedAt,
              title: callTitle,
              body: callBody,
            },
          },
    },
  ];

  const risks = supportedRisks(report).slice(0, SLACK_RISKS_MAX);
  const evidence = report.customerTruth
    .filter((fact): fact is typeof fact & { quote: string } => fact.evidenceStatus === "SUPPORTED" && Boolean(fact.quote?.trim()))
    .slice(0, SLACK_EVIDENCE_MAX)
    .map((fact) => {
      const segmentId = firstSegment(fact.evidence.segmentIds);
      const segment = options.transcript && segmentId ? resolveSegment(options.transcript, segmentId) : undefined;
      return {
        quote: fact.quote.trim(),
        speaker: fact.speakerName,
        timestamp: segment ? formatClock(segment.startMs) : undefined,
      };
    });

  const hasDealRisk = risks.length > 0;
  const slackTitle = truncateTitle(
    hasDealRisk ? `${accountName}: ${report.managerBrief.biggestRisk}` : `${accountName}: call processed`,
  );
  const changes = report.realityChecks.slice(0, SLACK_CHANGES_MAX).map((check) => ({
    label: check.title.trim() || "Reality check",
    before: check.sellerClaim,
    after: check.customerReality,
  }));
  const slack: SlackAlert = {
    enabled: true,
    type: hasDealRisk ? SLACK_ALERT_TYPE.DEAL_RISK : SLACK_ALERT_TYPE.CALL_PROCESSED,
    severity: hasDealRisk ? SLACK_SEVERITY.CRITICAL : SLACK_SEVERITY.SUCCESS,
    title: slackTitle,
    account: {
      name: accountName,
      dealName,
    },
    message: report.summary.headline,
    changes: changes.length ? changes : undefined,
    risks: risks.map((risk) => ({ label: risk.title, description: risk.summary })),
    evidence: evidence.length ? evidence : undefined,
    reportUrl: isHttpUrl(options.reportUrl) ? options.reportUrl : undefined,
  };

  return {
    accountName,
    contactName,
    dealName,
    crmActions,
    slack: {
      id: "slack",
      state: "SUPPORTED",
      label: "Notify Slack",
      value: slackTitle,
      reason: hasDealRisk
        ? "Supported deal risks will be posted after HubSpot writes finish. The webhook stays on the integration service."
        : "A call-processed alert will be posted after HubSpot writes finish. The webhook stays on the integration service.",
      defaultSelected: true,
      slack,
    },
  };
}

export function dateInputToDateTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00.000Z`;
  return toDateTime(parseTimestamp(trimmed));
}

export function buildDealOperation(input: {
  name: string;
  pipeline: string;
  stage: string;
  amount: number;
  closeDate: string;
}): HubspotOperation | undefined {
  const name = input.name.trim();
  const pipeline = input.pipeline.trim();
  const stage = input.stage.trim();
  const closeDate = dateInputToDateTime(input.closeDate);
  if (!name || !pipeline || !stage || !Number.isFinite(input.amount) || Number.isNaN(Date.parse(closeDate))) {
    return undefined;
  }
  return {
    operationId: "deal_1",
    type: HUBSPOT_OPERATION_TYPE.CREATE_DEAL,
    data: {
      name,
      pipeline,
      stage,
      amount: input.amount,
      closeDate,
    },
  };
}

export const DEAL_DEFAULTS = {
  pipeline: DEFAULT_HUBSPOT_PIPELINE,
  stage: DEFAULT_HUBSPOT_STAGE,
} as const;
