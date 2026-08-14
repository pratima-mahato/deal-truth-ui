import type { CallReport, DealSignal, EvidenceStatus, Transcript, TranscriptSegment } from "@/api/contracts";

export type StampStatus = "SUPPORTED" | "UNCONFIRMED" | "ABSENCE_BASED" | "BLOCKER";

export type DimensionState = "proven" | "blocked" | "weak" | "missing";

export const DEAL_DIMENSIONS = [
  { id: "pain_identified", label: "Pain identified" },
  { id: "business_impact_identified", label: "Business impact quantified" },
  { id: "decision_maker_identified", label: "Decision maker identified" },
  { id: "economic_buyer_identified", label: "Economic buyer identified" },
  { id: "timeline_identified", label: "Purchase timeline" },
  { id: "next_meeting_committed", label: "Next meeting committed" },
  { id: "competitor_active", label: "Competitor active" },
  { id: "blocker_active", label: "Blocker active" },
] as const;

export type DimensionId = (typeof DEAL_DIMENSIONS)[number]["id"];

export type DimensionTile = {
  id: DimensionId;
  label: string;
  state: DimensionState;
  value: string;
  why: string;
  segmentIds: string[];
};

const SIGNAL_ALIASES: Record<string, DimensionId> = {
  pain: "pain_identified",
  impact: "business_impact_identified",
  decision_maker: "decision_maker_identified",
  economic_buyer: "economic_buyer_identified",
  timeline: "timeline_identified",
  next_meeting: "next_meeting_committed",
  competitor: "competitor_active",
  blocker: "blocker_active",
};

const ADVERSE_DIMENSIONS = new Set<DimensionId>(["competitor_active", "blocker_active"]);

const SILENCE_GAP_MS = 2000;

export function stampTone(status: StampStatus): "proof" | "unproven" | "absent" | "blocker" {
  if (status === "SUPPORTED") return "proof";
  if (status === "UNCONFIRMED") return "unproven";
  if (status === "BLOCKER") return "blocker";
  return "absent";
}

export function stampLabel(status: StampStatus): string {
  if (status === "SUPPORTED") return "✓ PROVEN";
  if (status === "UNCONFIRMED") return "~ UNCONFIRMED";
  if (status === "BLOCKER") return "! BLOCKER";
  return "∅ NOTHING SAID";
}

export function evidenceToStamp(status: EvidenceStatus, asBlocker = false): StampStatus {
  if (asBlocker && status === "SUPPORTED") return "BLOCKER";
  if (status === "SUPPORTED") return "SUPPORTED";
  if (status === "UNCONFIRMED") return "UNCONFIRMED";
  return "ABSENCE_BASED";
}

export function resolveSegment(transcript: Transcript, id?: string): TranscriptSegment | undefined {
  if (!id) return undefined;
  return transcript.segments.find((segment) => segment.id === id);
}

export function speakerFor(transcript: Transcript, segment?: TranscriptSegment): string {
  if (!segment) return "";
  return transcript.speakers.find((speaker) => speaker.id === segment.speakerId)?.displayName ?? segment.speakerId;
}

function matchDimension(signal: DealSignal): DimensionId | null {
  if (signal.id in SIGNAL_ALIASES) return SIGNAL_ALIASES[signal.id];
  const label = signal.label.toLowerCase();
  if (label.includes("pain")) return "pain_identified";
  if (label.includes("impact") || label.includes("quantif")) return "business_impact_identified";
  if (label.includes("decision maker")) return "decision_maker_identified";
  if (label.includes("economic") || label.includes("buyer")) return "economic_buyer_identified";
  if (label.includes("timeline")) return "timeline_identified";
  if (label.includes("next meeting") || label.includes("next step")) return "next_meeting_committed";
  if (label.includes("compet")) return "competitor_active";
  if (label.includes("block") || label.includes("security")) return "blocker_active";
  return null;
}

function stateFromSignal(signal: DealSignal, dimension: DimensionId): DimensionState {
  if (signal.state === "missing") return "missing";
  if (ADVERSE_DIMENSIONS.has(dimension)) {
    return signal.state === "positive" || signal.state === "warning" || signal.state === "negative" ? "blocked" : "missing";
  }
  if (signal.state === "positive") return "proven";
  if (signal.state === "warning") return "weak";
  return "blocked";
}

function valueFor(dimension: DimensionId, state: DimensionState): string {
  if (dimension === "next_meeting_committed" && state === "blocked") return "REFUSED";
  if (state === "proven") return "PROVEN";
  if (state === "missing") return "NOT FOUND";
  if (dimension === "blocker_active") return "SECURITY";
  if (dimension === "competitor_active") return "ACTIVE";
  return "ACTIVE";
}

function segmentIdsFor(dimension: DimensionId, report: CallReport): string[] {
  if (dimension === "pain_identified" || dimension === "business_impact_identified") {
    return report.customerTruth.find((fact) => fact.category === "pain")?.evidence.segmentIds ?? [];
  }
  if (dimension === "timeline_identified") {
    return report.customerTruth.find((fact) => fact.category === "timeline")?.evidence.segmentIds ?? [];
  }
  if (dimension === "next_meeting_committed") {
    return (
      report.risks.find((risk) => /next meeting|next step/i.test(risk.title))?.evidence.segmentIds ??
      report.commitments.find((item) => item.status === "not_committed")?.evidence.segmentIds ??
      []
    );
  }
  if (dimension === "competitor_active") {
    return report.competitors[0]?.evidence.segmentIds ?? [];
  }
  if (dimension === "blocker_active") {
    return report.risks.find((risk) => risk.evidenceStatus === "SUPPORTED")?.evidence.segmentIds ?? [];
  }
  return [];
}

export function deriveDimensions(report: CallReport): DimensionTile[] {
  const byId = new Map<DimensionId, DealSignal>();
  for (const signal of [...report.dealSignals, ...report.buyingIntent.signals]) {
    const id = matchDimension(signal);
    if (id && !byId.has(id)) byId.set(id, signal);
  }

  const meetingMissing = byId.get("next_meeting_committed")?.state !== "positive";
  const meetingRefused = meetingMissing && report.risks.some((risk) => /next meeting|next step/i.test(risk.title));

  return DEAL_DIMENSIONS.map((dim) => {
    const signal = byId.get(dim.id);
    let state: DimensionState = signal ? stateFromSignal(signal, dim.id) : "missing";
    if (dim.id === "next_meeting_committed" && meetingRefused) state = "blocked";
    return {
      id: dim.id,
      label: dim.label,
      state,
      value: valueFor(dim.id, state),
      why: signal?.label ?? dim.label,
      segmentIds: segmentIdsFor(dim.id, report),
    };
  });
}

export function pipsFromTiles(tiles: DimensionTile[]): DimensionState[] {
  return tiles.map((tile) => tile.state);
}

export function pipsFromCallBadges(badges: string[] | undefined, biggestRisk?: string): DimensionState[] {
  const text = `${(badges ?? []).join(" ")} ${biggestRisk ?? ""}`.toLowerCase();
  return DEAL_DIMENSIONS.map((dim) => {
    if (dim.id === "pain_identified" && text.includes("pain")) return "proven";
    if (dim.id === "business_impact_identified" && (text.includes("impact") || text.includes("quantif"))) return "proven";
    if (dim.id === "decision_maker_identified" && text.includes("decision")) return "proven";
    if (dim.id === "economic_buyer_identified" && text.includes("buyer")) return "proven";
    if (dim.id === "timeline_identified" && text.includes("timeline")) return "proven";
    if (dim.id === "next_meeting_committed" && (text.includes("no next") || text.includes("refused"))) return "blocked";
    if (dim.id === "next_meeting_committed" && text.includes("next meeting")) return "proven";
    if (dim.id === "competitor_active" && text.includes("compet")) return "blocked";
    if (dim.id === "blocker_active" && (text.includes("security") || text.includes("block") || text.includes("budget"))) {
      return "blocked";
    }
    return "missing";
  });
}

export function countSilenceGaps(transcript: Transcript, minGapMs = SILENCE_GAP_MS): number {
  const segments = [...transcript.segments].sort((a, b) => a.startMs - b.startMs);
  let count = 0;
  for (let index = 1; index < segments.length; index += 1) {
    if (segments[index].startMs - segments[index - 1].endMs >= minGapMs) count += 1;
  }
  return count;
}

export function splitProse(value: string): string[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export const ABSENCE_COPY =
  "No evidence found. The customer never raised this — we report the gap instead of guessing.";
