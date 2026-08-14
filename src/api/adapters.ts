import {
  CALL_DIRECTIONS,
  CALL_STATUSES,
  CUSTOMER_TRUTH_CATEGORIES,
  FAILURE_KINDS,
  INSIGHT_TYPES,
  SEARCH_RESULT_KINDS,
  SPEAKER_ROLES,
  TERMINAL_OUTCOMES,
  type Call,
  type CallDirection,
  type CallReport,
  type CallStatus,
  type CreateCallRequest,
  type EvidenceRef,
  type FailureKind,
  type Insight,
  type InsightType,
  type ProcessingEvent,
  type ProcessingSnapshot,
  type SourceType,
  type SpeakerPatchRequest,
  type SpeakerRole,
  type Transcript,
  ASK_MODES,
  askAnswerSchema,
  callReportSchema,
  callSchema,
  followUpEmailSchema,
  insightSchema,
  shareLinkSchema,
  searchResponseSchema,
  type AskAnswer,
  type FollowUpEmail,
  type ShareLink,
  type SharedReport,
  type SearchResponse,
  type SearchResult,
  type SearchResultKind,
} from "./contracts";

type Dict = Record<string, unknown>;

export function asRecord(value: unknown): Dict {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Dict) : {};
}

export function pick(obj: Dict, ...keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function str(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Live EventOut.stage values are short names (`upload`, `transcribe`), not CallStatus. */
const STAGE_ALIASES: Record<string, CallStatus> = {
  CREATE: "CREATED",
  CREATED: "CREATED",
  UPLOAD: "UPLOADING",
  UPLOADING: "UPLOADING",
  QUEUE: "QUEUED",
  QUEUED: "QUEUED",
  TRANSCRIBE: "TRANSCRIBING",
  TRANSCRIBING: "TRANSCRIBING",
  TRANSCRIPTION: "TRANSCRIBING",
  RECAP: "WAITING_FOR_RECAP",
  WAITING_FOR_RECAP: "WAITING_FOR_RECAP",
  ANALYZE: "ANALYZING",
  ANALYZING: "ANALYZING",
  ANALYSIS: "ANALYZING",
  VALIDATE: "VALIDATING",
  VALIDATING: "VALIDATING",
  VALIDATION: "VALIDATING",
  INDEX: "INDEXING",
  INDEXING: "INDEXING",
  BUILD: "BUILDING_REPORT",
  BUILDING_REPORT: "BUILDING_REPORT",
  REPORT: "BUILDING_REPORT",
  SHIP: "SHIPPED",
  SHIPPED: "SHIPPED",
  PARTIAL: "PARTIAL",
  FAIL: "FAILED",
  FAILED: "FAILED",
  CANCEL: "CANCELLED",
  CANCELED: "CANCELLED",
  CANCELLED: "CANCELLED",
};

function asStatus(value: unknown, fallback: CallStatus = "CREATED"): CallStatus {
  const s = str(value).toUpperCase().replace(/[\s-]+/g, "_");
  if ((CALL_STATUSES as readonly string[]).includes(s)) return s as CallStatus;
  return STAGE_ALIASES[s] ?? fallback;
}

function asDirection(value: unknown): CallDirection {
  const s = str(value, "unknown");
  return (CALL_DIRECTIONS as readonly string[]).includes(s) ? (s as CallDirection) : "unknown";
}

function asSourceType(value: unknown): SourceType {
  const s = str(value, "upload");
  if (s === "url") return "source_url";
  if (s === "source_url" || s === "upload" || s === "sample") return s;
  return "upload";
}

function asRole(value: unknown): SpeakerRole {
  const s = str(value, "unknown");
  return (SPEAKER_ROLES as readonly string[]).includes(s) ? (s as SpeakerRole) : "unknown";
}

function asEventState(value: unknown): ProcessingEvent["state"] {
  const s = str(value, "started").toLowerCase();
  if (s === "succeeded" || s === "success" || s === "ok") return "succeeded";
  if (s === "failed" || s === "error" || s === "fail") return "failed";
  if (s === "skipped" || s === "skip") return "skipped";
  if (s === "started" || s === "start" || s === "running") return "started";
  return "started";
}

export function mapEvidence(raw: unknown): EvidenceRef {
  const obj = asRecord(raw);
  const fromIds = pick(obj, "segmentIds", "segment_ids");
  if (Array.isArray(fromIds)) {
    return { segmentIds: fromIds.map((id) => str(id)).filter(Boolean) };
  }
  const links = pick(obj, "evidence_links", "evidenceLinks");
  if (Array.isArray(links)) {
    const sorted = [...links].sort((a, b) => {
      const ao = num(pick(asRecord(a), "sort_order", "sortOrder"), 0);
      const bo = num(pick(asRecord(b), "sort_order", "sortOrder"), 0);
      return ao - bo;
    });
    return {
      segmentIds: sorted
        .map((link) => str(pick(asRecord(link), "transcript_segment_id", "transcriptSegmentId", "segment_id", "segmentId")))
        .filter(Boolean),
    };
  }
  if (Array.isArray(raw)) {
    return { segmentIds: raw.map((id) => str(id)).filter(Boolean) };
  }
  return { segmentIds: [] };
}

export function mapCall(raw: unknown): Call {
  const obj = asRecord(raw);
  const terminal = pick(obj, "terminal_outcome", "terminalOutcome");
  const failureKind = str(pick(obj, "failure_kind", "failureKind"));
  const mapped: Call = {
    id: str(pick(obj, "id")),
    title: str(pick(obj, "title")),
    customerName: str(pick(obj, "customer_name", "customerName")),
    repName: str(pick(obj, "rep_name", "repName")),
    callDirection: asDirection(pick(obj, "call_direction", "callDirection")),
    status: asStatus(pick(obj, "status")),
    terminalOutcome: (TERMINAL_OUTCOMES as readonly string[]).includes(str(terminal))
      ? (str(terminal) as Call["terminalOutcome"])
      : undefined,
    failureKind: (FAILURE_KINDS as readonly string[]).includes(failureKind)
      ? (failureKind as FailureKind)
      : undefined,
    failureCode: str(pick(obj, "failure_code", "failureCode")) || undefined,
    failureMessage: str(pick(obj, "failure_message", "failureMessage")) || undefined,
    durationMs: num(pick(obj, "duration_ms", "durationMs"), 0),
    language: str(pick(obj, "language"), "en"),
    createdAt: str(pick(obj, "created_at", "createdAt")),
    updatedAt: str(pick(obj, "updated_at", "updatedAt")),
    completedAt: str(pick(obj, "completed_at", "completedAt")) || undefined,
    sourceType: asSourceType(pick(obj, "source_type", "sourceType")),
    biggestRisk: str(pick(obj, "biggest_risk", "biggestRisk")) || undefined,
    signalBadges: asArray(pick(obj, "signal_badges", "signalBadges")).map((item) => str(item)),
    signalPips: (() => {
      const pips = asArray(pick(obj, "signal_pips", "signalPips"))
        .map((item) => str(item))
        .filter((item): item is "proven" | "blocked" | "weak" | "missing" =>
          item === "proven" || item === "blocked" || item === "weak" || item === "missing",
        );
      return pips.length ? pips : undefined;
    })(),
  };
  return callSchema.parse(mapped);
}

export function mapCallList(raw: unknown): { items: Call[]; total: number } {
  if (Array.isArray(raw)) {
    const items = raw.map(mapCall);
    return { items, total: items.length };
  }
  const obj = asRecord(raw);
  const items = asArray(pick(obj, "items")).map(mapCall);
  return { items, total: num(pick(obj, "total"), items.length) };
}

export function toCreateCallBody(input: CreateCallRequest): Dict {
  const direction = input.callDirection ?? "outbound";
  return {
    title: input.title,
    customer_name: input.customerName,
    rep_name: input.repName,
    call_direction: direction === "unknown" || direction === "internal" || direction === "inbound" || direction === "outbound"
      ? direction
      : "outbound",
    recording_mode: input.recordingMode ?? "mono",
    stereo_seller_channel: input.stereoSellerChannel,
    tracked_competitors: input.trackedCompetitors ?? [],
    tracked_keywords: input.trackedKeywords ?? [],
  };
}

export function toSpeakerPatchBody(body: SpeakerPatchRequest): Dict {
  return {
    speaker_id: body.speakerId,
    role: body.role,
    display_name: body.displayName,
    swap_with: body.swapWith,
  };
}

export function mapTranscript(raw: unknown): Transcript {
  const obj = asRecord(raw);
  const speakers = asArray(pick(obj, "speakers")).map((item) => {
    const s = asRecord(item);
    const display = str(pick(s, "display_name", "displayName"));
    const provider = str(pick(s, "provider_speaker_id", "providerSpeakerId"));
    return {
      id: str(pick(s, "id")),
      providerSpeakerId: provider,
      role: asRole(pick(s, "role")),
      displayName: display || provider || "Speaker",
      confidence: typeof pick(s, "confidence") === "number" ? num(pick(s, "confidence")) : undefined,
      manuallyOverridden: Boolean(pick(s, "manually_overridden", "manuallyOverridden")),
    };
  });
  const segments = asArray(pick(obj, "segments")).map((item) => {
    const s = asRecord(item);
    const roleRaw = pick(s, "speaker_role", "speakerRole");
    return {
      id: str(pick(s, "id")),
      speakerId: str(pick(s, "speaker_id", "speakerId")),
      startMs: num(pick(s, "start_ms", "startMs")),
      endMs: num(pick(s, "end_ms", "endMs")),
      text: str(pick(s, "text")),
      sequenceNumber: num(pick(s, "sequence_number", "sequenceNumber")),
      speakerRole: roleRaw != null ? asRole(roleRaw) : undefined,
    };
  });
  segments.sort((a, b) => {
    if (a.sequenceNumber !== b.sequenceNumber && (a.sequenceNumber || b.sequenceNumber)) {
      return a.sequenceNumber - b.sequenceNumber;
    }
    return a.startMs - b.startMs;
  });
  const durationMsRaw = pick(obj, "duration_ms", "durationMs");
  const durationMs =
    durationMsRaw != null && num(durationMsRaw) > 0
      ? num(durationMsRaw)
      : segments.length
        ? Math.max(...segments.map((segment) => Math.max(segment.endMs, segment.startMs)))
        : undefined;
  return {
    callId: str(pick(obj, "call_id", "callId")),
    language: str(pick(obj, "language"), "en"),
    durationMs,
    text: str(pick(obj, "text")) || segments.map((s) => s.text).join(" "),
    speakers,
    segments,
  };
}

export function mapEvent(raw: unknown, callId: string): ProcessingEvent | null {
  const obj = asRecord(raw);
  const stage = asStatus(pick(obj, "stage"), "CREATED");
  if (!str(pick(obj, "id"))) return null;
  return {
    id: str(pick(obj, "id")),
    callId: str(pick(obj, "call_id", "callId"), callId),
    stage,
    state: asEventState(pick(obj, "state")),
    attempt: num(pick(obj, "attempt"), 1),
    errorCode: str(pick(obj, "error_code", "errorCode")) || undefined,
    message: str(pick(obj, "message"), stage),
    createdAt: str(pick(obj, "created_at", "createdAt")),
  };
}

export function mapEventList(raw: unknown, callId: string): ProcessingEvent[] {
  const list = Array.isArray(raw) ? raw : asArray(pick(asRecord(raw), "events"));
  return list.map((item) => mapEvent(item, callId)).filter((item): item is ProcessingEvent => item != null);
}

export function mapSnapshot(raw: unknown, callId: string, status?: CallStatus): ProcessingSnapshot {
  const obj = asRecord(raw);
  const events = mapEventList(raw, callId);
  const derived =
    status ??
    asStatus(pick(obj, "status"), events.at(-1)?.stage ?? "CREATED");
  return {
    callId: str(pick(obj, "call_id", "callId"), callId),
    status: derived,
    events,
  };
}

function mapStringList(value: unknown): string[] {
  return asArray(value).map((item) => str(item)).filter(Boolean);
}

function mapCustomerFact(raw: unknown) {
  const obj = asRecord(raw);
  const category = str(pick(obj, "category"), "pain");
  return {
    id: str(pick(obj, "id")),
    category: (CUSTOMER_TRUTH_CATEGORIES as readonly string[]).includes(category) ? category : "pain",
    title: str(pick(obj, "title")),
    summary: str(pick(obj, "summary")),
    quote: str(pick(obj, "quote")) || undefined,
    speakerName: str(pick(obj, "speaker_name", "speakerName")) || undefined,
    confidence: typeof pick(obj, "confidence") === "number" ? num(pick(obj, "confidence")) : undefined,
    evidenceStatus: str(pick(obj, "evidence_status", "evidenceStatus"), "UNCONFIRMED"),
    evidence: mapEvidence(pick(obj, "evidence") ?? obj),
  };
}

function emptyBattlecard() {
  return { goal: "", questions: [], prepareFor: [], doNotForget: [], missingFields: [], warning: undefined as string | undefined };
}

function emptyManagerBrief() {
  return {
    dealLabel: "",
    whyTheyBuy: "",
    whyTheyDont: [] as string[],
    intent: "",
    competition: "",
    biggestRisk: "",
    customerCommitment: "",
    nextMove: "",
  };
}

function emptyMetrics() {
  return {
    talkRatio: { sellerPct: 0, customerPct: 0 },
    longestMonologue: { speakerName: "", durationMs: 0 },
    questionCount: 0,
    keywordHits: [] as { term: string; count: number }[],
  };
}

function emptySentiment() {
  return {
    overall: "",
    trajectory: "",
    points: [] as CallReport["buyerSentiment"]["points"],
    disclaimer: "Emotion is not buying intent.",
  };
}

/** ASSUMPTION: report JSON uses snake_case keys matching the architecture feature set. Both casings accepted. */
export function mapReport(raw: unknown): CallReport {
  const obj = asRecord(raw);
  const unavailable: string[] = [];
  const callRaw = pick(obj, "call") ?? obj;
  let call: Call;
  try {
    call = mapCall(callRaw);
  } catch {
    call = mapCall(obj);
  }

  const summaryObj = asRecord(pick(obj, "summary"));
  const summary = {
    headline: str(pick(summaryObj, "headline") ?? pick(obj, "headline")),
    tldr: str(pick(summaryObj, "tldr") ?? pick(obj, "tldr")),
    detailed: str(pick(summaryObj, "detailed", "summary", "summary_draft") ?? pick(obj, "detailed")),
    decisions: mapStringList(pick(summaryObj, "decisions") ?? pick(obj, "decisions")),
    actionItems: mapStringList(pick(summaryObj, "action_items", "actionItems") ?? pick(obj, "action_items")),
    nextSteps: mapStringList(pick(summaryObj, "next_steps", "nextSteps") ?? pick(obj, "next_steps")),
  };

  const dealSignals = asArray(pick(obj, "deal_signals", "dealSignals")).map((item) => {
    const s = asRecord(item);
    const state = str(pick(s, "state"), "missing");
    return {
      id: str(pick(s, "id")),
      label: str(pick(s, "label")),
      state: (["positive", "negative", "warning", "missing"] as const).includes(state as "missing")
        ? (state as "positive" | "negative" | "warning" | "missing")
        : "missing",
    };
  });

  const customerTruth = asArray(pick(obj, "customer_truth", "customerTruth")).map(mapCustomerFact);
  const objections = asArray(pick(obj, "objections")).map((item) => {
    const s = asRecord(item);
    const sev = str(pick(s, "severity"), "medium");
    return {
      id: str(pick(s, "id")),
      kind: str(pick(s, "kind"), "other"),
      title: str(pick(s, "title")),
      summary: str(pick(s, "summary")),
      severity: (["low", "medium", "high"] as const).includes(sev as "low") ? (sev as "low" | "medium" | "high") : "medium",
      coaching: str(pick(s, "coaching")) || undefined,
      relatedPain: str(pick(s, "related_pain", "relatedPain")) || undefined,
      evidence: mapEvidence(pick(s, "evidence") ?? s),
    };
  });
  const commitments = asArray(pick(obj, "commitments")).map((item) => {
    const s = asRecord(item);
    const status = str(pick(s, "status"), "unconfirmed");
    return {
      id: str(pick(s, "id")),
      side: str(pick(s, "side"), "seller") === "customer" ? "customer" as const : "seller" as const,
      owner: str(pick(s, "owner")),
      action: str(pick(s, "action")),
      dueText: str(pick(s, "due_text", "dueText")) || undefined,
      status: (["committed", "no_date", "not_committed", "unconfirmed"] as const).includes(status as "committed")
        ? (status as "committed" | "no_date" | "not_committed" | "unconfirmed")
        : "unconfirmed",
      evidence: mapEvidence(pick(s, "evidence") ?? s),
    };
  });
  const risks = asArray(pick(obj, "risks", "deal_killers", "dealKillers")).map((item) => {
    const s = asRecord(item);
    const sev = str(pick(s, "severity"), "medium");
    return {
      id: str(pick(s, "id")),
      title: str(pick(s, "title")),
      summary: str(pick(s, "summary")),
      severity: (["low", "medium", "high"] as const).includes(sev as "low") ? (sev as "low" | "medium" | "high") : "medium",
      evidenceStatus: str(pick(s, "evidence_status", "evidenceStatus"), "UNCONFIRMED"),
      evidence: mapEvidence(pick(s, "evidence") ?? s),
    };
  });
  const competitors = asArray(pick(obj, "competitors")).map((item) => {
    const s = asRecord(item);
    return {
      id: str(pick(s, "id")),
      name: str(pick(s, "name")),
      stance: str(pick(s, "stance")),
      likes: mapStringList(pick(s, "likes")),
      concerns: mapStringList(pick(s, "concerns")),
      evidence: mapEvidence(pick(s, "evidence") ?? s),
    };
  });
  const moments = asArray(pick(obj, "moments")).map((item) => {
    const s = asRecord(item);
    return {
      id: str(pick(s, "id")),
      kind: str(pick(s, "kind")),
      label: str(pick(s, "label", "title")),
      startMs: num(pick(s, "start_ms", "startMs")),
      evidence: mapEvidence(pick(s, "evidence") ?? s),
    };
  });
  const realityChecks = asArray(pick(obj, "reality_checks", "realityChecks")).map((item) => {
    const s = asRecord(item);
    const sev = str(pick(s, "severity"), "medium");
    return {
      id: str(pick(s, "id")),
      title: str(pick(s, "title")),
      sellerClaim: str(pick(s, "seller_claim", "sellerClaim")),
      customerReality: str(pick(s, "customer_reality", "customerReality")),
      reason: str(pick(s, "reason")),
      severity: (["low", "medium", "high"] as const).includes(sev as "low") ? (sev as "low" | "medium" | "high") : "medium",
      sellerEvidence: pick(s, "seller_evidence", "sellerEvidence")
        ? mapEvidence(pick(s, "seller_evidence", "sellerEvidence"))
        : undefined,
      customerEvidence: mapEvidence(pick(s, "customer_evidence", "customerEvidence") ?? s),
    };
  });

  const nextCallRaw = asRecord(pick(obj, "next_call", "nextCall", "battlecard"));
  const nextCall = Object.keys(nextCallRaw).length
    ? {
        goal: str(pick(nextCallRaw, "goal")),
        questions: mapStringList(pick(nextCallRaw, "questions")),
        prepareFor: asArray(pick(nextCallRaw, "prepare_for", "prepareFor")).map((item) => {
          const p = asRecord(item);
          const evidenceIds = pick(p, "evidence_segment_ids", "evidenceSegmentIds");
          return {
            title: str(pick(p, "title")),
            detail: str(pick(p, "detail")),
            evidenceSegmentIds: Array.isArray(evidenceIds)
              ? evidenceIds.map((id) => str(id)).filter(Boolean)
              : mapEvidence(p).segmentIds,
          };
        }),
        doNotForget: mapStringList(pick(nextCallRaw, "do_not_forget", "doNotForget")),
        missingFields: mapStringList(pick(nextCallRaw, "missing_fields", "missingFields")),
        warning: str(pick(nextCallRaw, "warning")) || undefined,
      }
    : emptyBattlecard();
  if (!Object.keys(nextCallRaw).length) unavailable.push("nextCall");

  const briefRaw = asRecord(pick(obj, "manager_brief", "managerBrief"));
  const managerBrief = Object.keys(briefRaw).length
    ? {
        dealLabel: str(pick(briefRaw, "deal_label", "dealLabel")),
        whyTheyBuy: str(pick(briefRaw, "why_they_buy", "whyTheyBuy")),
        whyTheyDont: mapStringList(pick(briefRaw, "why_they_dont", "whyTheyDont")),
        intent: str(pick(briefRaw, "intent")),
        competition: str(pick(briefRaw, "competition")),
        biggestRisk: str(pick(briefRaw, "biggest_risk", "biggestRisk")),
        customerCommitment: str(pick(briefRaw, "customer_commitment", "customerCommitment")),
        nextMove: str(pick(briefRaw, "next_move", "nextMove")),
      }
    : emptyManagerBrief();
  if (!Object.keys(briefRaw).length) unavailable.push("managerBrief");

  const followRaw = pick(obj, "follow_up", "followUp");
  const followUp = followRaw ? mapFollowUp(followRaw) : undefined;

  const sentimentRaw = asRecord(pick(obj, "buyer_sentiment", "buyerSentiment"));
  const buyerSentiment = Object.keys(sentimentRaw).length
    ? {
        overall: str(pick(sentimentRaw, "overall")),
        trajectory: str(pick(sentimentRaw, "trajectory")),
        disclaimer: str(pick(sentimentRaw, "disclaimer"), "Emotion is not buying intent."),
        points: asArray(pick(sentimentRaw, "points")).map((item) => {
          const p = asRecord(item);
          return {
            id: str(pick(p, "id")),
            startMs: num(pick(p, "start_ms", "startMs")),
            valence: num(pick(p, "valence")),
            label: str(pick(p, "label")),
            emotions: mapStringList(pick(p, "emotions")),
            evidence: mapEvidence(pick(p, "evidence") ?? p),
            intentValence:
              pick(p, "intent_valence", "intentValence") == null
                ? undefined
                : num(pick(p, "intent_valence", "intentValence")),
          };
        }),
      }
    : emptySentiment();
  if (!Object.keys(sentimentRaw).length) unavailable.push("buyerSentiment");

  const intentRaw = asRecord(pick(obj, "buying_intent", "buyingIntent"));
  const buyingIntent = {
    summary: str(pick(intentRaw, "summary")),
    signals: asArray(pick(intentRaw, "signals")).map((item) => {
      const s = asRecord(item);
      const state = str(pick(s, "state"), "missing");
      return {
        id: str(pick(s, "id")),
        label: str(pick(s, "label")),
        state: (["positive", "negative", "warning", "missing"] as const).includes(state as "missing")
          ? (state as "positive" | "negative" | "warning" | "missing")
          : "missing",
      };
    }),
  };

  const metricsRaw = asRecord(pick(obj, "metrics"));
  const talk = asRecord(pick(metricsRaw, "talk_ratio", "talkRatio"));
  const mono = asRecord(pick(metricsRaw, "longest_monologue", "longestMonologue"));
  const metrics = Object.keys(metricsRaw).length
    ? {
        talkRatio: {
          sellerPct: num(pick(talk, "seller_pct", "sellerPct")),
          customerPct: num(pick(talk, "customer_pct", "customerPct")),
        },
        longestMonologue: {
          speakerName: str(pick(mono, "speaker_name", "speakerName")),
          durationMs: num(pick(mono, "duration_ms", "durationMs")),
        },
        questionCount: num(pick(metricsRaw, "question_count", "questionCount")),
        keywordHits: asArray(pick(metricsRaw, "keyword_hits", "keywordHits")).map((item) => {
          const k = asRecord(item);
          return { term: str(pick(k, "term")), count: num(pick(k, "count")) };
        }),
        silenceGapCount:
          pick(metricsRaw, "silence_gap_count", "silenceGapCount") == null
            ? undefined
            : num(pick(metricsRaw, "silence_gap_count", "silenceGapCount")),
      }
    : emptyMetrics();
  if (!Object.keys(metricsRaw).length) unavailable.push("metrics");

  const listedUnavailable = mapStringList(pick(obj, "unavailable_sections", "unavailableSections"));
  const scoreRaw = asRecord(pick(obj, "call_score", "callScore"));
  const callScore = Object.keys(scoreRaw).length
    ? {
        score: num(pick(scoreRaw, "score")),
        label: str(pick(scoreRaw, "label")),
        summary: str(pick(scoreRaw, "summary")),
      }
    : undefined;
  const outline = asArray(pick(obj, "outline")).map((item) => {
    const s = asRecord(item);
    return {
      id: str(pick(s, "id")),
      title: str(pick(s, "title")),
      startMs: num(pick(s, "start_ms", "startMs")),
      endMs: num(pick(s, "end_ms", "endMs")),
      summary: str(pick(s, "summary")),
    };
  });
  const parsed = callReportSchema.safeParse({
    call,
    summary,
    dealSignals,
    customerTruth,
    objections,
    commitments,
    risks,
    competitors,
    moments,
    realityChecks,
    nextCall,
    managerBrief,
    followUp,
    buyerSentiment,
    buyingIntent,
    metrics,
    callScore,
    outline: outline.length ? outline : undefined,
    unavailableSections: [...new Set([...listedUnavailable, ...unavailable])],
  });
  if (parsed.success) return parsed.data;
  return {
    call,
    summary,
    dealSignals,
    customerTruth: [],
    objections: [],
    commitments: [],
    risks: [],
    competitors: [],
    moments: [],
    realityChecks: [],
    nextCall: emptyBattlecard(),
    managerBrief: emptyManagerBrief(),
    buyerSentiment: emptySentiment(),
    buyingIntent: { summary: "", signals: [] },
    metrics: emptyMetrics(),
    unavailableSections: ["report"],
  };
}

export function mapInsight(raw: unknown): Insight | null {
  const obj = asRecord(raw);
  const type = str(pick(obj, "type"));
  const typed: InsightType = (INSIGHT_TYPES as readonly string[]).includes(type)
    ? (type as InsightType)
    : "CUSTOMER_FACT";
  const candidate = {
    id: str(pick(obj, "id")),
    type: typed,
    title: str(pick(obj, "title")),
    summary: str(pick(obj, "summary")),
    severity: pick(obj, "severity") ? str(pick(obj, "severity")) : undefined,
    confidence: typeof pick(obj, "confidence") === "number" ? num(pick(obj, "confidence")) : undefined,
    evidenceStatus: str(pick(obj, "evidence_status", "evidenceStatus"), "UNCONFIRMED"),
    evidence: mapEvidence(pick(obj, "evidence") ?? obj),
    payload: asRecord(pick(obj, "payload")),
  };
  const parsed = insightSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function mapInsights(raw: unknown): Insight[] {
  return asArray(raw).map(mapInsight).filter((item): item is Insight => item != null);
}

export function mapAsk(raw: unknown): AskAnswer {
  const obj = asRecord(raw);
  const moments = asArray(pick(obj, "moments", "results", "retrieved")).map((item) => {
    const s = asRecord(item);
    return {
      title: str(pick(s, "title")),
      snippet: str(pick(s, "snippet", "text", "summary")),
      evidence: mapEvidence(pick(s, "evidence") ?? s),
    };
  });
  const modeRaw = str(pick(obj, "mode"));
  const mode = (ASK_MODES as readonly string[]).includes(modeRaw)
    ? (modeRaw as (typeof ASK_MODES)[number])
    : moments.length
      ? "retrieval"
      : undefined;
  return askAnswerSchema.parse({
    question: str(pick(obj, "question")),
    synthesis: str(pick(obj, "synthesis")) || undefined,
    mode,
    moments,
  });
}

export function mapFollowUp(raw: unknown): FollowUpEmail {
  const obj = asRecord(raw);
  const sentences = asArray(pick(obj, "sentences")).map((item, index) => {
    const s = asRecord(item);
    const kindRaw = str(pick(s, "kind"), "factual").toLowerCase();
    const kind =
      kindRaw === "non_factual" || kindRaw === "non-factual"
        ? "non_factual"
        : kindRaw === "unsupported"
          ? "unsupported"
          : "factual";
    const ids = pick(s, "evidence_segment_ids", "evidenceSegmentIds");
    return {
      id: str(pick(s, "id"), `fu-${index}`),
      text: str(pick(s, "text")),
      evidenceSegmentIds: Array.isArray(ids) ? ids.map((id) => str(id)) : mapEvidence(s).segmentIds,
      supported: Boolean(pick(s, "supported") ?? kind === "factual"),
      kind,
      explanation: str(pick(s, "explanation")) || undefined,
    };
  });
  return followUpEmailSchema.parse({
    subject: str(pick(obj, "subject"), "Follow-up"),
    sentences,
  });
}

export function mapShareLink(raw: unknown): ShareLink {
  const obj = asRecord(raw);
  const rawUrl = str(pick(obj, "url"));
  const fromUrl = rawUrl.match(/\/(?:api\/v1\/)?shared\/([^/?#]+)/)?.[1];
  const token =
    str(pick(obj, "token", "share_token", "shareToken", "public_token", "publicToken")) ||
    (fromUrl ? decodeURIComponent(fromUrl) : "");
  return shareLinkSchema.parse({
    id: str(pick(obj, "id"), token),
    token,
    url: token ? `/shared/${encodeURIComponent(token)}` : rawUrl,
    expiresAt: str(pick(obj, "expires_at", "expiresAt")) || undefined,
  });
}

export function mapShared(raw: unknown): SharedReport {
  const obj = asRecord(raw);
  const reportRaw = pick(obj, "report") ?? obj;
  const transcriptRaw = pick(obj, "transcript");
  return {
    report: mapReport(reportRaw),
    transcript: mapTranscript(transcriptRaw ?? { call_id: "", speakers: [], segments: [] }),
  };
}

function asSearchKind(value: unknown, fallback: SearchResultKind): SearchResultKind {
  const kind = str(value, fallback);
  return (SEARCH_RESULT_KINDS as readonly string[]).includes(kind) ? (kind as SearchResultKind) : fallback;
}

export function mapSearchResult(raw: unknown, fallbackKind: SearchResultKind = "segment"): SearchResult {
  const obj = asRecord(raw);
  const callTitle =
    str(pick(obj, "call_title", "callTitle", "customer_name", "customerName", "call_name", "callName")) || "Call";
  const snippet = str(pick(obj, "snippet", "text", "summary", "body"));
  const callId = str(pick(obj, "call_id", "callId"));
  const startMsRaw = pick(obj, "start_ms", "startMs");
  const startMs = startMsRaw == null ? undefined : num(startMsRaw);
  const explicitTitle = str(pick(obj, "title"));
  const title =
    fallbackKind === "segment"
      ? callTitle !== "Call"
        ? callTitle
        : "Transcript match"
      : explicitTitle || callTitle || (snippet ? snippet.slice(0, 96) : "Match");
  const id = str(pick(obj, "id")) || `${fallbackKind}-${callId || "call"}-${startMs ?? title.slice(0, 12)}`;
  const evidenceRaw = pick(obj, "evidence");
  const segmentId = str(pick(obj, "segment_id", "segmentId"));
  const evidence = evidenceRaw
    ? mapEvidence(evidenceRaw)
    : fallbackKind === "segment" && str(pick(obj, "id"))
      ? { segmentIds: [str(pick(obj, "id"))] }
      : segmentId
        ? { segmentIds: [segmentId] }
        : undefined;
  return {
    id,
    kind: asSearchKind(pick(obj, "kind"), fallbackKind),
    callId,
    callTitle,
    title,
    snippet,
    insightType: (() => {
      const type = str(pick(obj, "insight_type", "insightType"));
      return (INSIGHT_TYPES as readonly string[]).includes(type) ? (type as SearchResult["insightType"]) : undefined;
    })(),
    evidence,
    startMs,
  };
}

/** Live search may return `{ segments: [{ call_id, text, start_ms }] }` instead of grouped camelCase. */
export function mapSearchResponse(raw: unknown, query = ""): SearchResponse {
  const obj = asRecord(raw);
  const grouped = asRecord(pick(obj, "groups"));
  const hasGroups = Object.keys(grouped).length > 0;
  const insights = asArray(
    hasGroups ? pick(grouped, "insights") : pick(obj, "insights"),
  ).map((item) => mapSearchResult(item, "insight"));
  const segments = asArray(
    hasGroups ? pick(grouped, "segments") : pick(obj, "segments", "results"),
  ).map((item) => mapSearchResult(item, "segment"));
  const calls = asArray(hasGroups ? pick(grouped, "calls") : pick(obj, "calls")).map((item) =>
    mapSearchResult(item, "call"),
  );
  if (calls.length === 0) {
    const seen = new Set<string>();
    for (const segment of segments) {
      if (!segment.callId || seen.has(segment.callId)) continue;
      seen.add(segment.callId);
      calls.push({
        id: `call-${segment.callId}`,
        kind: "call",
        callId: segment.callId,
        callTitle: segment.callTitle,
        title: segment.callTitle !== "Call" ? segment.callTitle : "Matching call",
        snippet: segment.snippet,
      });
    }
  }
  const mapped = {
    query: str(pick(obj, "query", "q"), query),
    groups: { insights, segments, calls },
    total: insights.length + segments.length + calls.length,
  };
  const parsed = searchResponseSchema.safeParse(mapped);
  return parsed.success ? parsed.data : mapped;
}
