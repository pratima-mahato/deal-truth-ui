import type { CallRefusals, Deal, ProcessingEvent, ProcessingSnapshot } from "@/api/contracts";
import { DEMO_CALL_ID } from "./demoTranscript";

export const DEMO_DEAL_ID = "deal-demo";
export const DEMO_DEAL_ALIASES = new Set(["demo", DEMO_DEAL_ID]);

const DEMO_CREATED_AT = "2026-08-11T15:48:00.000Z";

export const DEMO_REFUSALS: CallRefusals = {
  callId: DEMO_CALL_ID,
  refusedCount: 4,
  shippedCount: 23,
  refusals: [
    {
      id: "r1",
      code: "EVIDENCE_UNSUPPORTED",
      claim: "Customer has budget approved for this quarter",
      why: "No customer segment states a budget approval or a quarterly envelope.",
    },
    {
      id: "r2",
      code: "EVIDENCE_WRONG_SPEAKER",
      claim: "Sarah confirmed a follow-up meeting",
      why: "The cited segment is the seller speaking. Customer-only claims cannot rest on seller turns.",
    },
    {
      id: "r3",
      code: "EVIDENCE_UNSUPPORTED",
      claim: "Customer said pricing is acceptable",
      why: "The quote is not in the transcript. The customer said the price was almost double.",
    },
    {
      id: "r4",
      code: "EVIDENCE_SEGMENT_MISSING",
      claim: "VP of Operations is the decision maker",
      why: "The segment id on the candidate claim does not exist in this transcript.",
    },
  ],
};

const GATE_ROWS: Array<Pick<ProcessingEvent, "id" | "stage" | "state" | "errorCode" | "message">> = [
  { id: "g1", stage: "TRANSCRIBING", state: "started", message: "submitted job pyai_7f3a · webhook armed" },
  { id: "g2", stage: "TRANSCRIBING", state: "succeeded", message: "37 segments · 2 speakers · en · 38:12" },
  { id: "g3", stage: "TRANSCRIBING", state: "succeeded", message: "role resolution: speaker_0→seller (0.92) · speaker_1→customer (0.90)" },
  { id: "g4", stage: "WAITING_FOR_RECAP", state: "started", message: "headline + 5 action items" },
  { id: "g5", stage: "ANALYZING", state: "started", message: "fast model → 31 candidate claims" },
  { id: "g6", stage: "ANALYZING", state: "started", message: "judge model → 27 survived" },
  { id: "g7", stage: "ANALYZING", state: "started", message: "emotions axis empty for 2 segments · degraded, continuing" },
  { id: "g8", stage: "VALIDATING", state: "succeeded", message: "27 claims → checking segment ids, speaker roles, verbatim quotes" },
  {
    id: "g9",
    stage: "VALIDATING",
    state: "failed",
    errorCode: "EVIDENCE_UNSUPPORTED",
    message: '"Customer has budget approved for this quarter" · dropped',
  },
  {
    id: "g10",
    stage: "VALIDATING",
    state: "failed",
    errorCode: "EVIDENCE_WRONG_SPEAKER",
    message: '"Sarah confirmed a follow-up meeting" · cited a seller segment · dropped',
  },
  {
    id: "g11",
    stage: "VALIDATING",
    state: "failed",
    errorCode: "EVIDENCE_UNSUPPORTED",
    message: '"Customer said pricing is acceptable" · quote not in transcript · dropped',
  },
  {
    id: "g12",
    stage: "VALIDATING",
    state: "failed",
    errorCode: "EVIDENCE_SEGMENT_MISSING",
    message: '"VP of Operations is the decision maker" · dropped',
  },
  { id: "g13", stage: "VALIDATING", state: "succeeded", message: "23 claims shipped · 4 refused" },
  { id: "g14", stage: "INDEXING", state: "started", message: "23 chunks embedded · 1024-dim" },
  { id: "g15", stage: "BUILDING_REPORT", state: "succeeded", message: "report.json + report.md written" },
  { id: "g16", stage: "SHIPPED", state: "succeeded", message: "SHIPPED" },
];

export function demoGateSnapshot(callId: string): ProcessingSnapshot {
  return {
    callId,
    status: "SHIPPED",
    events: GATE_ROWS.map((row) => ({
      ...row,
      callId,
      createdAt: DEMO_CREATED_AT,
    })),
  };
}

export const demoDeal: Deal = {
  id: DEMO_DEAL_ID,
  accountName: "Example Inc.",
  primaryContact: "Sarah Mitchell",
  repName: "Rahul Mehta",
  callCount: 3,
  spanDays: 18,
  calls: [
    {
      callId: "call-demo-intro",
      title: "Intro call",
      createdAt: "2026-07-28T15:00:00.000Z",
      durationMs: 1334000,
      states: {
        pain_identified: "proven",
        business_impact_identified: "missing",
        decision_maker_identified: "missing",
        economic_buyer_identified: "missing",
        timeline_identified: "missing",
        next_meeting_committed: "proven",
        competitor_active: "missing",
        blocker_active: "missing",
      },
    },
    {
      callId: "call-demo-deep",
      title: "Product deep-dive",
      createdAt: "2026-08-05T15:00:00.000Z",
      durationMs: 2462000,
      states: {
        pain_identified: "proven",
        business_impact_identified: "proven",
        decision_maker_identified: "proven",
        economic_buyer_identified: "missing",
        timeline_identified: "proven",
        next_meeting_committed: "proven",
        competitor_active: "blocked",
        blocker_active: "missing",
      },
    },
    {
      callId: DEMO_CALL_ID,
      title: "Enterprise discovery",
      createdAt: "2026-08-13T15:00:00.000Z",
      durationMs: 2292000,
      states: {
        pain_identified: "proven",
        business_impact_identified: "proven",
        decision_maker_identified: "missing",
        economic_buyer_identified: "missing",
        timeline_identified: "missing",
        next_meeting_committed: "blocked",
        competitor_active: "blocked",
        blocker_active: "blocked",
      },
    },
  ],
  deltas: [],
};
