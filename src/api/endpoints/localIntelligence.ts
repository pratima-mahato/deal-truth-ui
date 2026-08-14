import { ApiError } from "../errors";
import { listCalls, getCallReport } from "./calls";
import { getTranscript } from "./transcripts";
import type { CallReport, SearchResponse, RecommendationsResponse, Transcript } from "../contracts";
import { formatClock } from "@/lib/utils";

function matchesQuery(text: string, query: string): boolean {
  const hay = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (hay.includes(q)) return true;
  const aliases: Record<string, string[]> = {
    pricing: ["price", "commercial", "budget"],
    objections: ["objection", "concern", "risk"],
    integrations: ["salesforce", "crm", "integration"],
    competitor: ["nexusai", "competition"],
    intent: ["buying", "move forward"],
  };
  return q
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .some((token) => {
      if (hay.includes(token) || hay.includes(token.slice(0, 4))) return true;
      return (aliases[token] ?? []).some((alias) => hay.includes(alias));
    });
}

async function loadShipped(): Promise<{ report: CallReport; transcript?: Transcript }[]> {
  const { items } = await listCalls();
  const ready = items.filter((call) => call.status === "SHIPPED" || call.status === "PARTIAL");
  const rows: { report: CallReport; transcript?: Transcript }[] = [];
  for (const call of ready) {
    try {
      const [report, transcript] = await Promise.all([
        getCallReport(call.id),
        getTranscript(call.id).catch(() => undefined),
      ]);
      rows.push({ report, transcript });
    } catch {
      // Skip calls whose intelligence is not available.
    }
  }
  return rows;
}

export async function searchFromLoadedCalls(q: string): Promise<SearchResponse> {
  const query = q.trim();
  const insights: SearchResponse["groups"]["insights"] = [];
  const segments: SearchResponse["groups"]["segments"] = [];
  const calls: SearchResponse["groups"]["calls"] = [];

  const rows = await loadShipped();
  for (const { report, transcript } of rows) {
    const call = report.call;
    if (matchesQuery(`${call.title} ${call.customerName} ${call.biggestRisk ?? ""}`, query)) {
      calls.push({
        id: `call-${call.id}`,
        kind: "call",
        callId: call.id,
        callTitle: call.title,
        title: call.title,
        snippet: call.customerName,
      });
    }
    if (transcript) {
      for (const segment of transcript.segments) {
        if (matchesQuery(segment.text, query)) {
          segments.push({
            id: `seg-${call.id}-${segment.id}`,
            kind: "segment",
            callId: call.id,
            callTitle: call.title,
            title: `Transcript · ${formatClock(segment.startMs)}`,
            snippet: segment.text,
            evidence: { segmentIds: [segment.id] },
            startMs: segment.startMs,
          });
        }
      }
    }
    const packs = [
      ...report.objections.map((i) => ({ ...i, insightType: "OBJECTION" as const })),
      ...report.risks.map((i) => ({ ...i, insightType: "DEAL_RISK" as const })),
      ...report.customerTruth.map((i) => ({ ...i, insightType: "CUSTOMER_FACT" as const })),
      ...report.competitors.map((i) => ({
        id: i.id,
        title: i.name,
        summary: i.stance,
        evidence: i.evidence,
        insightType: "COMPETITOR" as const,
      })),
      ...report.realityChecks.map((i) => ({
        id: i.id,
        title: i.title,
        summary: i.reason,
        evidence: i.customerEvidence,
        insightType: "REALITY_CHECK" as const,
      })),
    ];
    for (const item of packs) {
      if (matchesQuery(`${item.title} ${item.summary} ${item.insightType}`, query)) {
        const firstId = item.evidence.segmentIds[0];
        const startMs = transcript?.segments.find((s) => s.id === firstId)?.startMs;
        insights.push({
          id: `ins-${call.id}-${item.id}`,
          kind: "insight",
          callId: call.id,
          callTitle: call.title,
          title: item.title,
          snippet: item.summary,
          insightType: item.insightType,
          evidence: item.evidence,
          startMs,
        });
      }
    }
  }

  return {
    query,
    groups: {
      insights: insights.slice(0, 12),
      segments: segments.slice(0, 12),
      calls: calls.slice(0, 8),
    },
    total: insights.length + segments.length + calls.length,
  };
}

export async function recommendationsFromLoadedCalls(): Promise<RecommendationsResponse> {
  const rows = await loadShipped();
  const shipped = rows.map((r) => r.report);
  const pricing = shipped.filter((r) => r.objections.some((o) => /pric/i.test(`${o.kind} ${o.title}`)) || /pric/i.test(r.call.biggestRisk ?? ""));
  const noNext = shipped.filter((r) => r.commitments.some((c) => c.status === "not_committed") || /no next/i.test(`${r.call.biggestRisk} ${r.call.signalBadges?.join(" ")}`));
  const competitor = shipped.filter((r) => r.competitors.length > 0);
  const security = shipped.filter((r) => r.risks.some((risk) => /security/i.test(risk.title)));
  return {
    available: true,
    items: [
      {
        id: "rec-pricing",
        kind: "aggregate_insight" as const,
        title: `${pricing.length} pricing objection${pricing.length === 1 ? "" : "s"} went unresolved`,
        description: `${pricing.length} pricing objection${pricing.length === 1 ? "" : "s"} went unresolved`,
        count: pricing.length,
        query: "pricing",
        callIds: pricing.map((r) => r.call.id),
      },
      {
        id: "rec-next",
        kind: "aggregate_insight" as const,
        title: `${noNext.length} call${noNext.length === 1 ? "" : "s"} ended with no next meeting`,
        description: `${noNext.length} call${noNext.length === 1 ? "" : "s"} ended with no next meeting`,
        count: noNext.length,
        query: "next meeting",
        callIds: noNext.map((r) => r.call.id),
      },
      {
        id: "rec-comp",
        kind: "aggregate_insight" as const,
        title: `${competitor.length} competitor${competitor.length === 1 ? "" : "s"} active in open deals`,
        description: `${competitor.length} competitor${competitor.length === 1 ? "" : "s"} are active in open deals`,
        count: competitor.length,
        query: "competitor",
        callIds: competitor.map((r) => r.call.id),
      },
      {
        id: "rec-sec",
        kind: "saved_search" as const,
        title: `${security.length} deal${security.length === 1 ? "" : "s"} behind a security review`,
        description: `${security.length} deal${security.length === 1 ? "" : "s"} are behind a security review`,
        count: security.length,
        query: "security",
        callIds: security.map((r) => r.call.id),
      },
    ].filter((item) => item.count > 0),
  };
}

export function isMissingEndpoint(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.code === "NOT_FOUND");
}
