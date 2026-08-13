import type { CallReport, EvidenceRef, EvidenceStatus, OutlineSection, Severity, Transcript } from "@/api/contracts";

export type Tone = "positive" | "warning" | "danger" | "info" | "neutral";

export type ClickableInsight = {
  id: string;
  title: string;
  quote?: string;
  speakerName?: string;
  startMs?: number;
  severity?: Severity;
  why: string;
  action?: string;
  evidence: EvidenceRef;
  evidenceStatus?: EvidenceStatus;
  kind: "signal" | "risk" | "objection" | "fact" | "moment";
};

export type OverviewModel = {
  score: { score: number; label: string; summary: string };
  narrative: string;
  bullets: string[];
  intent: { value: string; tone: Tone };
  risk: { value: string; tone: Tone };
  nextStep: { value: string; tone: Tone };
  engagement: { value: string; tone: Tone };
  buyingSignals: ClickableInsight[];
  attention: ClickableInsight[];
  intelligence: { label: string; value: string; tone?: Tone }[];
  outline: OutlineSection[];
};

function firstSegmentTime(transcript: Transcript, ids: string[]): number | undefined {
  const segs = transcript.segments.filter((s) => ids.includes(s.id));
  if (!segs.length) return undefined;
  return Math.min(...segs.map((s) => s.startMs));
}

function quoteFor(transcript: Transcript, ids: string[], fallback?: string): string | undefined {
  const first = transcript.segments.find((s) => ids.includes(s.id));
  return first?.text ?? fallback;
}

function speakerFor(transcript: Transcript, ids: string[], fallback?: string): string | undefined {
  const first = transcript.segments.find((s) => ids.includes(s.id));
  if (!first) return fallback;
  return transcript.speakers.find((s) => s.id === first.speakerId)?.displayName ?? fallback;
}

function deriveScore(report: CallReport): { score: number; label: string; summary: string } {
  if (report.callScore) return report.callScore;
  const signals = report.dealSignals;
  const positive = signals.filter((s) => s.state === "positive").length;
  const negative = signals.filter((s) => s.state === "negative").length;
  const score = Math.max(32, Math.min(92, Math.round(58 + positive * 8 - negative * 6)));
  return {
    score,
    label: score >= 75 ? "Strong" : score >= 55 ? "Mixed" : "Weak",
    summary: report.summary.headline,
  };
}

function deriveOutline(report: CallReport, transcript: Transcript): OutlineSection[] {
  if (report.outline?.length) return report.outline;
  if (!report.moments.length) {
    return [
      {
        id: "full",
        title: "Full conversation",
        startMs: 0,
        endMs: report.call.durationMs,
        summary: report.summary.headline,
      },
    ];
  }
  return report.moments.map((moment, index) => {
    const next = report.moments[index + 1];
    return {
      id: moment.id,
      title: moment.label,
      startMs: moment.startMs,
      endMs: next?.startMs ?? report.call.durationMs,
      summary: quoteFor(transcript, moment.evidence.segmentIds) ?? moment.label,
    };
  });
}

export function buildOverviewModel(report: CallReport, transcript: Transcript): OverviewModel {
  const buying = report.customerTruth.filter(
    (fact) =>
      (fact.category === "buying_signal" || fact.category === "requirement" || fact.category === "pain") &&
      fact.evidenceStatus === "SUPPORTED" &&
      fact.evidence.segmentIds.length > 0,
  );
  const intro = report.customerTruth.find((f) => f.category === "commitment" && f.evidence.segmentIds.length);
  const signals: ClickableInsight[] = [...buying, intro]
    .filter((item): item is NonNullable<typeof item> => !!item)
    .slice(0, 4)
    .map((fact) => ({
      id: fact.id,
      title: fact.title,
      quote: fact.quote ?? quoteFor(transcript, fact.evidence.segmentIds),
      speakerName: speakerFor(transcript, fact.evidence.segmentIds, fact.speakerName),
      startMs: firstSegmentTime(transcript, fact.evidence.segmentIds),
      why: fact.summary,
      action: "Jump to the exact customer language and confirm the signal in context.",
      evidence: fact.evidence,
      evidenceStatus: fact.evidenceStatus,
      kind: "signal",
    }));

  const attention: ClickableInsight[] = [
    ...report.objections.map((item) => ({
      id: item.id,
      title: item.title,
      quote: quoteFor(transcript, item.evidence.segmentIds),
      speakerName: speakerFor(transcript, item.evidence.segmentIds),
      startMs: firstSegmentTime(transcript, item.evidence.segmentIds),
      severity: item.severity,
      why: item.summary,
      action: item.coaching,
      evidence: item.evidence,
      kind: "objection" as const,
    })),
    ...report.risks
      .filter((risk) => risk.evidenceStatus === "SUPPORTED")
      .map((risk) => ({
        id: risk.id,
        title: risk.title,
        quote: quoteFor(transcript, risk.evidence.segmentIds),
        speakerName: speakerFor(transcript, risk.evidence.segmentIds),
        startMs: firstSegmentTime(transcript, risk.evidence.segmentIds),
        severity: risk.severity,
        why: risk.summary,
        action: "Open the cited moment, then decide whether this still blocks the next meeting.",
        evidence: risk.evidence,
        evidenceStatus: risk.evidenceStatus,
        kind: "risk" as const,
      })),
  ].slice(0, 4);

  const intentState = report.dealSignals.find((s) => /intent/i.test(s.label))?.state;
  const nextMeeting = report.dealSignals.find((s) => /next meeting/i.test(s.label))?.state;
  const budget = report.customerTruth.find((f) => f.category === "budget");
  const timeline = report.customerTruth.find((f) => f.category === "timeline");
  const competition = report.competitors[0];
  const nextCommitment = report.commitments.find((c) => c.status === "committed" && c.side === "seller");

  return {
    score: deriveScore(report),
    narrative: report.summary.tldr,
    bullets: [
      ...report.summary.decisions.slice(0, 3),
      ...report.summary.nextSteps.slice(0, 2),
    ].slice(0, 5),
    intent: {
      value: intentState === "positive" ? "High" : intentState === "warning" ? "Mixed" : "Unclear",
      tone: intentState === "positive" ? "positive" : "warning",
    },
    risk: {
      value: report.objections.find((o) => o.kind === "pricing")
        ? "Pricing"
        : report.call.biggestRisk ?? "None",
      tone: report.objections[0]?.severity === "high" ? "danger" : "warning",
    },
    nextStep: {
      value: nextMeeting === "missing" ? "Not booked" : nextCommitment?.action ?? report.nextCall.goal,
      tone: nextMeeting === "missing" ? "warning" : "positive",
    },
    engagement: {
      value: report.metrics.talkRatio.customerPct >= 45 ? "High" : "Seller-heavy",
      tone: report.metrics.talkRatio.customerPct >= 45 ? "positive" : "info",
    },
    buyingSignals: signals,
    attention,
    intelligence: [
      { label: "Deal stage", value: report.managerBrief.dealLabel },
      { label: "Intent", value: report.managerBrief.intent, tone: "positive" },
      { label: "Budget", value: budget?.evidenceStatus === "SUPPORTED" ? "Mentioned" : "Unconfirmed", tone: budget?.evidenceStatus === "SUPPORTED" ? "info" : "warning" },
      { label: "Timeline", value: timeline?.evidenceStatus === "SUPPORTED" ? timeline.title : "Not stated", tone: timeline?.evidenceStatus === "SUPPORTED" ? "info" : "warning" },
      { label: "Decision maker", value: report.dealSignals.find((s) => /buyer/i.test(s.label))?.state === "missing" ? "Not on the call" : "Present" },
      { label: "Competition", value: competition ? competition.name : "Not mentioned", tone: competition ? "warning" : "neutral" },
      { label: "Next step", value: nextMeeting === "missing" ? "No meeting booked" : report.nextCall.goal, tone: nextMeeting === "missing" ? "warning" : "positive" },
    ],
    outline: deriveOutline(report, transcript),
  };
}

export function annotationsForReport(report: CallReport): Map<string, { label: string; tone: Tone }[]> {
  const map = new Map<string, { label: string; tone: Tone }[]>();
  const add = (ids: string[], label: string, tone: Tone) => {
    for (const id of ids) {
      const current = map.get(id) ?? [];
      current.push({ label, tone });
      map.set(id, current);
    }
  };
  for (const fact of report.customerTruth) {
    if (fact.category === "buying_signal") add(fact.evidence.segmentIds, "Buying signal", "positive");
    if (fact.category === "budget") add(fact.evidence.segmentIds, "Pricing", "warning");
    if (fact.category === "blocker") add(fact.evidence.segmentIds, "Blocker", "danger");
  }
  for (const obj of report.objections) {
    add(obj.evidence.segmentIds, obj.kind === "pricing" ? "Pricing risk" : "Objection", obj.severity === "high" ? "danger" : "warning");
  }
  return map;
}
