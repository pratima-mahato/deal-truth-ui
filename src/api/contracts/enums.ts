export const CALL_STATUSES = [
  "CREATED",
  "UPLOADING",
  "QUEUED",
  "TRANSCRIBING",
  "WAITING_FOR_RECAP",
  "ANALYZING",
  "VALIDATING",
  "INDEXING",
  "BUILDING_REPORT",
  "SHIPPED",
  "PARTIAL",
  "FAILED",
  "CANCELLED",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export const TERMINAL_OUTCOMES = ["SHIPPED", "PARTIAL", "FAILED", "CANCELLED"] as const;
export type TerminalOutcome = (typeof TERMINAL_OUTCOMES)[number];

export const FAILURE_KINDS = [
  "INFRASTRUCTURE",
  "TRANSCRIPTION",
  "RECAP",
  "ML_INFERENCE",
  "VALIDATION",
  "STORAGE",
  "DATABASE",
  "USER_INPUT",
] as const;
export type FailureKind = (typeof FAILURE_KINDS)[number];

export const INSIGHT_TYPES = [
  "CUSTOMER_FACT",
  "BUYING_SIGNAL",
  "OBJECTION",
  "COMMITMENT",
  "DEAL_RISK",
  "COMPETITOR",
  "REALITY_CHECK",
  "CALL_MOMENT",
  "COACHING",
  "SENTIMENT_POINT",
  "QUALIFICATION_SIGNAL",
] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

export const EVIDENCE_STATUSES = ["SUPPORTED", "ABSENCE_BASED", "UNCONFIRMED"] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const SPEAKER_ROLES = ["seller", "customer", "unknown"] as const;
export type SpeakerRole = (typeof SPEAKER_ROLES)[number];

export const CALL_DIRECTIONS = ["inbound", "outbound", "internal", "unknown"] as const;
export type CallDirection = (typeof CALL_DIRECTIONS)[number];

export const SOURCE_TYPES = ["upload", "source_url", "url", "sample"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SEVERITIES = ["low", "medium", "high"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CUSTOMER_TRUTH_CATEGORIES = [
  "pain",
  "requirement",
  "buying_signal",
  "blocker",
  "budget",
  "timeline",
  "competition",
  "commitment",
] as const;
export type CustomerTruthCategory = (typeof CUSTOMER_TRUTH_CATEGORIES)[number];

export const COMMITMENT_SIDES = ["seller", "customer"] as const;
export type CommitmentSide = (typeof COMMITMENT_SIDES)[number];

export const COMMITMENT_STATUSES = ["committed", "no_date", "not_committed", "unconfirmed"] as const;
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];

export const SEARCH_RESULT_KINDS = ["insight", "segment", "call"] as const;
export type SearchResultKind = (typeof SEARCH_RESULT_KINDS)[number];

export const RECOMMENDATION_KINDS = ["saved_search", "aggregate_insight"] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export const PROCESSING_STAGES: { status: CallStatus; label: string }[] = [
  { status: "UPLOADING", label: "Uploading" },
  { status: "QUEUED", label: "Queued" },
  { status: "TRANSCRIBING", label: "Transcribing" },
  { status: "WAITING_FOR_RECAP", label: "Waiting for Recap" },
  { status: "ANALYZING", label: "Analyzing" },
  { status: "VALIDATING", label: "Checking evidence" },
  { status: "INDEXING", label: "Indexing" },
  { status: "BUILDING_REPORT", label: "Building report" },
];

export function isTerminalStatus(status: CallStatus): boolean {
  return (
    status === "SHIPPED" ||
    status === "PARTIAL" ||
    status === "FAILED" ||
    status === "CANCELLED"
  );
}

export function isReportReadyStatus(status: CallStatus): boolean {
  return status === "SHIPPED" || status === "PARTIAL";
}
