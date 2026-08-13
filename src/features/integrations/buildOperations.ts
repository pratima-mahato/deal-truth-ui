import type { CallReport, Transcript } from "@/api/contracts";
import type {
  CreateCallData,
  CreateDealData,
  CreateMeetingData,
  CreateNoteData,
  CreateTaskData,
  HubSpotOperation,
  SlackAlert,
  SlackChange,
  SlackEvidence,
  SlackRisk,
} from "@/api/integrations/contracts";
import { newIntegrationId } from "@/api/integrations/ids";
import { formatClock, speakerName } from "@/lib/utils";

export type ActionKind = "deal" | "note" | "task" | "call" | "meeting";

export type IntegrationDraft = {
  selected: Record<ActionKind, boolean>;
  deal: CreateDealData;
  note: CreateNoteData;
  task: CreateTaskData;
  call: CreateCallData;
  meeting: CreateMeetingData;
  slack: SlackAlert;
  omissions: string[];
};

const PREFS_KEY = "opengong.integrations.prefs";

type StoredPrefs = {
  selected?: Partial<Record<ActionKind, boolean>>;
  slackEnabled?: boolean;
  slackType?: string;
  slackSeverity?: SlackAlert["severity"];
};

export function loadIntegrationPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as StoredPrefs) : {};
  } catch {
    return {};
  }
}

export function saveIntegrationPrefs(prefs: StoredPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function isoPlusDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function emptyDraft(): IntegrationDraft {
  const now = new Date().toISOString();
  return {
    selected: { deal: true, note: true, task: true, call: true, meeting: false },
    deal: {
      name: "",
      pipeline: "default",
      stage: "appointmentscheduled",
      amount: 0,
      closeDate: isoPlusDays(30),
    },
    note: { body: "", timestamp: now },
    task: {
      taskType: "TODO",
      dueAt: isoPlusDays(7),
      subject: "",
      body: "",
      priority: "MEDIUM",
    },
    call: { timestamp: now, title: "", body: "", durationMs: 0 },
    meeting: { timestamp: isoPlusDays(7), title: "", body: "" },
    slack: {
      enabled: false,
      type: "DEAL_RISK",
      severity: "warning",
      title: "",
      account: {},
      message: "",
      changes: [],
      risks: [],
      evidence: [],
    },
    omissions: [],
  };
}

function quoteFromEvidence(transcript: Transcript, segmentIds: string[]): SlackEvidence | null {
  const id = segmentIds[0];
  if (!id) return null;
  const segment = transcript.segments.find((s) => s.id === id);
  if (!segment?.text.trim()) return null;
  const speaker = speakerName(transcript.speakers, segment.speakerId);
  return {
    quote: segment.text.trim(),
    speaker,
    timestamp: formatClock(segment.startMs),
  };
}

export function buildDraftFromIntelligence(
  report?: CallReport,
  transcript?: Transcript,
  reportUrl?: string,
): IntegrationDraft {
  const draft = emptyDraft();
  const prefs = loadIntegrationPrefs();
  if (prefs.selected) draft.selected = { ...draft.selected, ...prefs.selected };
  if (prefs.slackEnabled != null) draft.slack.enabled = prefs.slackEnabled;
  if (prefs.slackType) draft.slack.type = prefs.slackType;
  if (prefs.slackSeverity) draft.slack.severity = prefs.slackSeverity;

  if (!report) {
    draft.omissions.push("Open a call to prefill CRM actions from verified conversation intelligence.");
    return draft;
  }

  const call = report.call;
  draft.deal.name = report.managerBrief.dealLabel || call.customerName || call.title;
  draft.omissions.push("Deal amount, pipeline, and stage are not in the call report — enter values that match your HubSpot portal.");
  if (report.nextCall.missingFields.includes("Purchase timeline") || report.nextCall.missingFields.includes("Timeline identified")) {
    draft.omissions.push("Close date is a suggestion. No purchase timeline was identified on the call.");
  }

  const noteParts = [report.summary.headline, report.summary.tldr, report.summary.detailed].filter(Boolean);
  draft.note.body = noteParts.join("\n\n");
  draft.note.timestamp = call.createdAt;

  const nextMove = report.managerBrief.nextMove || report.nextCall.goal || report.summary.actionItems[0] || "";
  draft.task.subject = nextMove || `Follow up with ${call.customerName || "the account"}`;
  draft.task.body = [report.nextCall.goal, ...report.nextCall.questions.slice(0, 3)].filter(Boolean).join("\n");
  draft.task.priority = report.risks.some((r) => r.severity === "high") ? "HIGH" : "MEDIUM";
  draft.task.taskType = "TODO";

  draft.call.title = call.title || `${call.customerName} call`;
  draft.call.body = report.summary.tldr || report.summary.headline;
  draft.call.timestamp = call.createdAt;
  draft.call.durationMs = call.durationMs;

  const meetingCommitted = report.dealSignals.some((s) => s.id === "next_meeting" && s.state === "positive");
  if (meetingCommitted) {
    draft.selected.meeting = true;
    draft.meeting.title = `Follow-up with ${call.customerName || "account"}`;
    draft.meeting.body = report.nextCall.goal;
    draft.meeting.timestamp = isoPlusDays(7);
  } else {
    draft.selected.meeting = false;
    draft.omissions.push("No follow-up meeting was committed on the call, so Log meeting is off.");
  }

  const highRisk = report.risks.find((r) => r.severity === "high") ?? report.risks[0];
  const evidence: SlackEvidence[] = [];
  if (transcript) {
    for (const risk of report.risks) {
      if (risk.evidenceStatus !== "SUPPORTED") continue;
      const ev = quoteFromEvidence(transcript, risk.evidence.segmentIds);
      if (ev) evidence.push(ev);
      if (evidence.length >= 2) break;
    }
    if (evidence.length === 0) {
      for (const fact of report.customerTruth) {
        if (fact.evidenceStatus !== "SUPPORTED") continue;
        const ev = quoteFromEvidence(transcript, fact.evidence.segmentIds);
        if (ev) {
          evidence.push(ev);
          break;
        }
      }
    }
  }

  const changes: SlackChange[] = report.realityChecks.slice(0, 2).map((check) => ({
    label: check.title,
    before: check.sellerClaim,
    after: check.customerReality,
  }));

  const risks: SlackRisk[] = report.risks.slice(0, 3).map((risk) => ({
    label: risk.title,
    description: risk.summary,
  }));

  draft.slack = {
    ...draft.slack,
    type: highRisk ? "DEAL_RISK" : "CRM_UPDATED",
    severity: highRisk?.severity === "high" ? "critical" : highRisk ? "warning" : "info",
    title: highRisk ? `Deal risk detected` : "Call intelligence ready",
    account: {
      name: call.customerName,
      deal: report.managerBrief.dealLabel,
    },
    message: report.managerBrief.biggestRisk || report.summary.tldr,
    changes,
    risks,
    evidence,
    reportUrl,
  };

  return draft;
}

export function requiredFieldErrors(draft: IntegrationDraft): string[] {
  const errors: string[] = [];
  if (draft.selected.deal) {
    if (!draft.deal.name.trim()) errors.push("Deal name is required.");
    if (!draft.deal.pipeline.trim()) errors.push("Deal pipeline is required.");
    if (!draft.deal.stage.trim()) errors.push("Deal stage is required.");
    if (!Number.isFinite(draft.deal.amount) || draft.deal.amount < 0) errors.push("Deal amount is required.");
    if (!draft.deal.closeDate) errors.push("Deal close date is required.");
  }
  if (draft.selected.note && !draft.note.body.trim()) errors.push("Note body is required.");
  if (draft.selected.task) {
    if (!draft.task.subject.trim()) errors.push("Task subject is required.");
    if (!draft.task.dueAt) errors.push("Task due date is required.");
    if (!draft.task.taskType) errors.push("Task type is required.");
  }
  if (draft.selected.call) {
    if (!draft.call.title.trim()) errors.push("Call title is required.");
    if (!draft.call.body.trim()) errors.push("Call body is required.");
    if (!draft.call.timestamp) errors.push("Call timestamp is required.");
  }
  if (draft.selected.meeting) {
    if (!draft.meeting.title.trim()) errors.push("Meeting title is required.");
    if (!draft.meeting.body.trim()) errors.push("Meeting body is required.");
    if (!draft.meeting.timestamp) errors.push("Meeting timestamp is required.");
  }
  if (!Object.values(draft.selected).some(Boolean)) errors.push("Select at least one CRM action.");
  return errors;
}

export function composeOperations(draft: IntegrationDraft): HubSpotOperation[] {
  const ops: HubSpotOperation[] = [];
  if (draft.selected.deal) {
    ops.push({ operationId: newIntegrationId("deal"), type: "CREATE_DEAL", data: { ...draft.deal } });
  }
  if (draft.selected.note) {
    ops.push({
      operationId: newIntegrationId("note"),
      type: "CREATE_NOTE",
      data: { body: draft.note.body, timestamp: draft.note.timestamp },
    });
  }
  if (draft.selected.task) {
    ops.push({ operationId: newIntegrationId("task"), type: "CREATE_TASK", data: { ...draft.task } });
  }
  if (draft.selected.call) {
    ops.push({ operationId: newIntegrationId("call"), type: "CREATE_CALL", data: { ...draft.call } });
  }
  if (draft.selected.meeting) {
    ops.push({ operationId: newIntegrationId("meeting"), type: "CREATE_MEETING", data: { ...draft.meeting } });
  }
  return ops;
}

export const ACTION_COPY: Record<ActionKind, { title: string; description: string }> = {
  deal: {
    title: "Create Deal",
    description: "Create a new opportunity from verified deal intelligence.",
  },
  note: {
    title: "Add Call Note",
    description: "Add the call summary and key findings to HubSpot.",
  },
  task: {
    title: "Create Follow-up Task",
    description: "Turn the recommended next step into a HubSpot task.",
  },
  call: {
    title: "Log Completed Call",
    description: "Record the completed call and duration in HubSpot.",
  },
  meeting: {
    title: "Log Completed Meeting",
    description: "Record the completed meeting in HubSpot.",
  },
};

export const ACTION_LABELS: Record<ActionKind, string> = {
  deal: ACTION_COPY.deal.title,
  note: ACTION_COPY.note.title,
  task: ACTION_COPY.task.title,
  call: ACTION_COPY.call.title,
  meeting: ACTION_COPY.meeting.title,
};

export const OPERATION_LABELS: Record<HubSpotOperation["type"], string> = {
  CREATE_DEAL: "Deal",
  CREATE_NOTE: "Call note",
  CREATE_TASK: "Follow-up task",
  CREATE_CALL: "Logged call",
  CREATE_MEETING: "Logged meeting",
};

export const SLACK_TYPE_OPTIONS: { id: string; label: string; apiType: string }[] = [
  { id: "DEAL_RISK", label: "Deal risk detected", apiType: "DEAL_RISK" },
  { id: "CRM_UPDATED", label: "CRM updated", apiType: "CRM_UPDATED" },
  { id: "FOLLOW_UP_CREATED", label: "Follow-up created", apiType: "FOLLOW_UP_CREATED" },
  { id: "CALL_PROCESSED", label: "Call processed", apiType: "CALL_PROCESSED" },
  { id: "GENERAL", label: "General", apiType: "GENERAL" },
];
