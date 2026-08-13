import type { Call, CallReport, FollowUpEmail, Transcript } from "@/api/contracts";
import { CALL_STATUSES, PROCESSING_STAGES, isTerminalStatus, type CallStatus } from "@/api/contracts";
import { ACME_CALL_ID, buildAcmeTranscript } from "./fixtures/acmeTranscript";
import { acmeCall, buildAcmeInsights, buildAcmeReport } from "./fixtures/acmeReport";
import {
  helixCall,
  helixReport,
  helixTranscript,
  lumenCall,
  lumenReport,
  lumenTranscript,
  northstarCall,
  northstarReport,
  northstarTranscript,
  orbitCall,
  orbitReport,
  orbitTranscript,
  seedCalls,
  vegaCall,
  zenithCall,
} from "./fixtures/otherCalls";

export type StoreCall = {
  call: Call;
  transcript?: Transcript;
  report?: CallReport;
  shareToken?: string;
};

const STAGE_MS = 1100;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

function seed(): Map<string, StoreCall> {
  const map = new Map<string, StoreCall>();
  map.set(ACME_CALL_ID, {
    call: clone(acmeCall),
    transcript: buildAcmeTranscript(),
    report: buildAcmeReport(),
    shareToken: "share-acme-demo",
  });
  map.set(northstarCall.id, {
    call: clone(northstarCall),
    transcript: northstarTranscript(),
    report: northstarReport(),
  });
  map.set(helixCall.id, {
    call: clone(helixCall),
    transcript: helixTranscript(),
    report: helixReport(),
  });
  map.set(orbitCall.id, {
    call: clone(orbitCall),
    transcript: orbitTranscript(),
    report: orbitReport(),
  });
  map.set(lumenCall.id, {
    call: clone(lumenCall),
    transcript: lumenTranscript(),
    report: lumenReport(),
  });
  map.set(vegaCall.id, { call: clone(vegaCall) });
  map.set(zenithCall.id, { call: clone(zenithCall) });
  return map;
}

const records = seed();
const timers = new Map<string, number>();

function getRecord(id: string): StoreCall {
  const record = records.get(id);
  if (!record) {
    throw Object.assign(new Error("Call not found"), { code: "NOT_FOUND" });
  }
  return record;
}

export const mockStore = {
  list(): Call[] {
    return [...records.values()]
      .map((r) => r.call)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  get(id: string): StoreCall {
    return getRecord(id);
  },

  insights(id: string) {
    const record = getRecord(id);
    if (!record.report) return [];
    return buildAcmeInsights(record.report);
  },

  create(input: {
    title: string;
    customerName: string;
    repName: string;
    callDirection: Call["callDirection"];
    sourceType?: Call["sourceType"];
  }): Call {
    const id = `call-${Math.random().toString(16).slice(2, 8)}`;
    const call: Call = {
      id,
      title: input.title,
      customerName: input.customerName,
      repName: input.repName,
      callDirection: input.callDirection,
      status: "CREATED",
      durationMs: 0,
      language: "en",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sourceType: input.sourceType ?? "upload",
    };
    records.set(id, { call });
    return call;
  },

  loadSample(): Call {
    const call = this.create({
      title: "Enterprise sales discovery (sample)",
      customerName: "Sarah Mitchell · Acme Inc.",
      repName: "Rahul Mehta",
      callDirection: "outbound",
      sourceType: "sample",
    });
    this.markUploaded(call.id);
    this.startProcessing(call.id);
    return this.get(call.id).call;
  },

  markUploaded(id: string): Call {
    const record = getRecord(id);
    record.call.status = "QUEUED";
    record.call.updatedAt = nowIso();
    return record.call;
  },

  startProcessing(id: string): Call {
    const record = getRecord(id);
    if (record.call.status === "CREATED") {
      record.call.status = "QUEUED";
    }
    const fail = /fail/i.test(record.call.title);
    record.call.updatedAt = nowIso();
    this.advance(id, fail);
    return record.call;
  },

  advance(id: string, fail: boolean): void {
    window.clearTimeout(timers.get(id));
    const record = getRecord(id);
    const stages = PROCESSING_STAGES.map((s) => s.status);
    const currentIndex = Math.max(
      0,
      stages.indexOf(record.call.status as (typeof stages)[number]),
    );

    if (fail && record.call.status === "TRANSCRIBING") {
      record.call.status = "FAILED";
      record.call.terminalOutcome = "FAILED";
      record.call.failureKind = "TRANSCRIPTION";
      record.call.failureCode = "PYAI_JOB_FAILED";
      record.call.failureMessage =
        "Transcription failed. You can retry processing; this is not a deal-quality failure.";
      record.call.updatedAt = nowIso();
      return;
    }

    if (isTerminalStatus(record.call.status)) return;

    const next = stages[currentIndex + 1];
    if (!next) {
      this.complete(id);
      return;
    }

    record.call.status = next;
    record.call.updatedAt = nowIso();

    if (next === "BUILDING_REPORT") {
      const handle = window.setTimeout(() => this.complete(id), STAGE_MS);
      timers.set(id, handle);
      return;
    }

    const handle = window.setTimeout(() => this.advance(id, fail), STAGE_MS);
    timers.set(id, handle);
  },

  complete(id: string): void {
    const record = getRecord(id);
    const report = buildAcmeReport({
      ...clone(acmeCall),
      id,
      title: record.call.title,
      customerName: record.call.customerName,
      repName: record.call.repName,
      callDirection: record.call.callDirection,
      sourceType: record.call.sourceType,
      createdAt: record.call.createdAt,
    });
    record.transcript = buildAcmeTranscript(id);
    record.report = report;
    record.call = {
      ...report.call,
      id,
      title: record.call.title,
      status: "SHIPPED",
      terminalOutcome: "SHIPPED",
      completedAt: nowIso(),
      updatedAt: nowIso(),
    };
    record.report.call = record.call;
  },

  retry(id: string): Call {
    const record = getRecord(id);
    record.call.status = "QUEUED";
    record.call.terminalOutcome = undefined;
    record.call.failureKind = undefined;
    record.call.failureCode = undefined;
    record.call.failureMessage = undefined;
    record.call.updatedAt = nowIso();
    this.startProcessing(id);
    return record.call;
  },

  cancel(id: string): Call {
    const record = getRecord(id);
    window.clearTimeout(timers.get(id));
    record.call.status = "CANCELLED";
    record.call.terminalOutcome = "CANCELLED";
    record.call.updatedAt = nowIso();
    return record.call;
  },

  events(id: string) {
    const record = getRecord(id);
    const current = CALL_STATUSES.indexOf(record.call.status);
    const events = PROCESSING_STAGES.filter((stage) => CALL_STATUSES.indexOf(stage.status) <= current).map(
      (stage, index) => ({
        id: `${id}-evt-${index}`,
        callId: id,
        stage: stage.status,
        state:
          stage.status === record.call.status && record.call.status === "FAILED"
            ? ("failed" as const)
            : CALL_STATUSES.indexOf(stage.status) < current || isTerminalStatus(record.call.status)
              ? ("succeeded" as const)
              : ("started" as const),
        message: stage.label,
        createdAt: record.call.updatedAt,
      }),
    );
    return { callId: id, status: record.call.status, events };
  },

  swapSpeakers(id: string): Transcript {
    const record = getRecord(id);
    if (!record.transcript) {
      throw Object.assign(new Error("Transcript not ready"), { code: "NOT_FOUND" });
    }
    record.transcript = {
      ...record.transcript,
      speakers: record.transcript.speakers.map((speaker) => ({
        ...speaker,
        role: speaker.role === "seller" ? "customer" : speaker.role === "customer" ? "seller" : speaker.role,
        manuallyOverridden: true,
      })),
    };
    record.call.status = "ANALYZING";
    record.call.updatedAt = nowIso();
    this.advance(id, false);
    return record.transcript;
  },

  renameSpeaker(id: string, speakerId: string, displayName: string): Transcript {
    const record = getRecord(id);
    if (!record.transcript) {
      throw Object.assign(new Error("Transcript not ready"), { code: "NOT_FOUND" });
    }
    record.transcript = {
      ...record.transcript,
      speakers: record.transcript.speakers.map((speaker) =>
        speaker.id === speakerId ? { ...speaker, displayName, manuallyOverridden: true } : speaker,
      ),
    };
    return record.transcript;
  },

  followUp(id: string): FollowUpEmail {
    const record = getRecord(id);
    if (!record.report?.followUp) {
      throw Object.assign(new Error("Follow-up not available"), { code: "NOT_FOUND" });
    }
    return clone(record.report.followUp);
  },

  ask(id: string, question: string) {
    const record = getRecord(id);
    const report = record.report;
    if (!report) {
      throw Object.assign(new Error("Report not ready"), { code: "NOT_FOUND" });
    }
    const q = question.toLowerCase();
    const pool = [
      ...report.risks.map((r) => ({ title: r.title, snippet: r.summary, evidence: r.evidence })),
      ...report.objections.map((r) => ({ title: r.title, snippet: r.summary, evidence: r.evidence })),
      ...report.customerTruth
        .filter((r) => r.evidence.segmentIds.length)
        .map((r) => ({ title: r.title, snippet: r.summary, evidence: r.evidence })),
    ];
    const moments = pool
      .filter((item) => q.length < 4 || `${item.title} ${item.snippet}`.toLowerCase().includes(q.split(" ")[0] ?? ""))
      .slice(0, 3);
    const picked = moments.length ? moments : pool.slice(0, 3);
    return {
      question,
      synthesis:
        picked.length > 0
          ? `I found ${picked.length} relevant moments tied to transcript evidence.`
          : undefined,
      moments: picked,
    };
  },

  share(id: string) {
    const record = getRecord(id);
    const token = record.shareToken ?? `share-${id}`;
    record.shareToken = token;
    return {
      id: `share-${id}`,
      token,
      url: `/shared/${token}`,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
  },

  byShareToken(token: string): StoreCall {
    const record = [...records.values()].find((item) => item.shareToken === token);
    if (!record || !record.report || !record.transcript) {
      throw Object.assign(new Error("Share link invalid"), { code: "NOT_FOUND" });
    }
    return record;
  },

  search(q: string) {
    const query = q.trim().toLowerCase();
    const insights: {
      id: string;
      kind: "insight";
      callId: string;
      callTitle: string;
      title: string;
      snippet: string;
      insightType: "OBJECTION" | "DEAL_RISK" | "CUSTOMER_FACT" | "COMPETITOR" | "REALITY_CHECK";
      evidence?: { segmentIds: string[] };
      startMs?: number;
    }[] = [];
    const segments: {
      id: string;
      kind: "segment";
      callId: string;
      callTitle: string;
      title: string;
      snippet: string;
      evidence: { segmentIds: string[] };
      startMs?: number;
    }[] = [];
    const calls: {
      id: string;
      kind: "call";
      callId: string;
      callTitle: string;
      title: string;
      snippet: string;
    }[] = [];

    for (const record of records.values()) {
      const { call, transcript, report } = record;
      if (call.title.toLowerCase().includes(query) || call.customerName.toLowerCase().includes(query) || matchesQuery(`${call.title} ${call.customerName} ${call.biggestRisk ?? ""}`, query)) {
        calls.push({
          id: `call-${call.id}`,
          kind: "call",
          callId: call.id,
          callTitle: call.title,
          title: call.title,
          snippet: `${call.customerName} · ${call.repName}`,
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
      if (report) {
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
            const startMs = record.transcript?.segments.find((s) => s.id === firstId)?.startMs;
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
    }

    return {
      query: q,
      groups: {
        insights: insights.slice(0, 12),
        segments: segments.slice(0, 12),
        calls: calls.slice(0, 8),
      },
      total: insights.length + segments.length + calls.length,
    };
  },

  recommendations() {
    const shipped = this.list().filter((c) => c.status === "SHIPPED" || c.status === "PARTIAL");
    const pricing = shipped.filter((c) => /pric/i.test(`${c.biggestRisk} ${c.signalBadges?.join(" ")}`));
    const noNext = shipped.filter((c) => /no next/i.test(`${c.biggestRisk} ${c.signalBadges?.join(" ")}`));
    const competitor = shipped.filter((c) => /compet/i.test(`${c.biggestRisk} ${c.signalBadges?.join(" ")}`));
    const security = shipped.filter((c) => /security/i.test(`${c.biggestRisk} ${c.signalBadges?.join(" ")}`));
    return {
      available: true,
      items: [
        {
          id: "rec-pricing",
          kind: "aggregate_insight" as const,
          title: "Pricing objections",
          description: `${pricing.length} calls mention pricing concerns`,
          count: pricing.length,
          query: "pricing",
          callIds: pricing.map((c) => c.id),
        },
        {
          id: "rec-next",
          kind: "aggregate_insight" as const,
          title: "No next step",
          description: `${noNext.length} calls have no clear next meeting`,
          count: noNext.length,
          query: "next meeting",
          callIds: noNext.map((c) => c.id),
        },
        {
          id: "rec-comp",
          kind: "aggregate_insight" as const,
          title: "Competitor mentions",
          description: `${competitor.length} calls show competitor risk`,
          count: competitor.length,
          query: "competitor",
          callIds: competitor.map((c) => c.id),
        },
        {
          id: "rec-sec",
          kind: "saved_search" as const,
          title: "Security blockers",
          description: `${security.length} calls require security review`,
          count: security.length,
          query: "security",
          callIds: security.map((c) => c.id),
        },
      ].filter((item) => item.count > 0),
    };
  },
};

function matchesQuery(text: string, query: string): boolean {
  const hay = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (hay.includes(q)) return true;
  const aliases: Record<string, string[]> = {
    pricing: ["price", "commercial", "budget"],
    objections: ["objection", "concern", "risk"],
    integrations: ["salesforce", "crm", "integration"],
    competitor: ["acmeai", "competition"],
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

function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export { seedCalls };
export type { CallStatus };
