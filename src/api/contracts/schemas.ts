import { z } from "zod";
import {
  CALL_DIRECTIONS,
  CALL_STATUSES,
  COMMITMENT_SIDES,
  COMMITMENT_STATUSES,
  CUSTOMER_TRUTH_CATEGORIES,
  EVIDENCE_STATUSES,
  FAILURE_KINDS,
  INSIGHT_TYPES,
  RECOMMENDATION_KINDS,
  SEARCH_RESULT_KINDS,
  SEVERITIES,
  SOURCE_TYPES,
  SPEAKER_ROLES,
  TERMINAL_OUTCOMES,
} from "./enums";

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean().optional().default(false),
    details: z.record(z.unknown()).optional(),
    failure_kind: z.string().optional(),
    failureKind: z.string().optional(),
  }),
  requestId: z.string().optional(),
});

export const evidenceRefSchema = z.object({
  segmentIds: z.array(z.string()),
});

export const speakerSchema = z.object({
  id: z.string(),
  providerSpeakerId: z.string(),
  role: z.enum(SPEAKER_ROLES),
  displayName: z.string(),
  confidence: z.number().optional(),
  manuallyOverridden: z.boolean().optional(),
});

export const dimensionPipStateSchema = z.enum(["proven", "blocked", "weak", "missing"]);

export const callSchema = z.object({
  id: z.string(),
  title: z.string(),
  customerName: z.string(),
  repName: z.string(),
  callDirection: z.enum(CALL_DIRECTIONS),
  status: z.enum(CALL_STATUSES),
  terminalOutcome: z.enum(TERMINAL_OUTCOMES).optional(),
  failureKind: z.enum(FAILURE_KINDS).optional(),
  failureCode: z.string().optional(),
  failureMessage: z.string().optional(),
  durationMs: z.number(),
  language: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  sourceType: z.enum(SOURCE_TYPES),
  biggestRisk: z.string().optional(),
  signalBadges: z.array(z.string()).optional(),
  /** Eight deal-dimension pips for the workspace table. */
  signalPips: z.array(dimensionPipStateSchema).optional(),
});

export const paginatedCallsSchema = z.object({
  items: z.array(callSchema),
  total: z.number().int(),
});

export const transcriptSegmentSchema = z.object({
  id: z.string(),
  speakerId: z.string(),
  startMs: z.number().int(),
  endMs: z.number().int(),
  text: z.string(),
  sequenceNumber: z.number().int(),
  speakerRole: z.enum(SPEAKER_ROLES).optional(),
});

export const transcriptSchema = z.object({
  callId: z.string(),
  language: z.string(),
  text: z.string(),
  durationMs: z.number().optional(),
  speakers: z.array(speakerSchema),
  segments: z.array(transcriptSegmentSchema),
});

export const dealSignalSchema = z.object({
  id: z.string(),
  label: z.string(),
  state: z.enum(["positive", "negative", "warning", "missing"]),
});

export const customerFactSchema = z.object({
  id: z.string(),
  category: z.enum(CUSTOMER_TRUTH_CATEGORIES),
  title: z.string(),
  summary: z.string(),
  quote: z.string().optional(),
  speakerName: z.string().optional(),
  confidence: z.number().optional(),
  evidenceStatus: z.enum(EVIDENCE_STATUSES),
  evidence: evidenceRefSchema,
});

export const objectionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  summary: z.string(),
  severity: z.enum(SEVERITIES),
  coaching: z.string().optional(),
  relatedPain: z.string().optional(),
  evidence: evidenceRefSchema,
});

export const commitmentSchema = z.object({
  id: z.string(),
  side: z.enum(COMMITMENT_SIDES),
  owner: z.string(),
  action: z.string(),
  dueText: z.string().optional(),
  status: z.enum(COMMITMENT_STATUSES),
  evidence: evidenceRefSchema,
});

export const dealRiskSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  severity: z.enum(SEVERITIES),
  evidenceStatus: z.enum(EVIDENCE_STATUSES),
  evidence: evidenceRefSchema,
});

export const competitorMentionSchema = z.object({
  id: z.string(),
  name: z.string(),
  stance: z.string(),
  likes: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
  evidence: evidenceRefSchema,
});

export const callMomentSchema = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string(),
  startMs: z.number().int(),
  evidence: evidenceRefSchema,
});

export const realityCheckSchema = z.object({
  id: z.string(),
  title: z.string(),
  sellerClaim: z.string(),
  customerReality: z.string(),
  reason: z.string(),
  severity: z.enum(SEVERITIES),
  sellerEvidence: evidenceRefSchema.optional(),
  customerEvidence: evidenceRefSchema,
});

export const battlecardSchema = z.object({
  goal: z.string(),
  questions: z.array(z.string()),
  prepareFor: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      evidenceSegmentIds: z.array(z.string()).optional(),
    }),
  ),
  doNotForget: z.array(z.string()),
  missingFields: z.array(z.string()),
  warning: z.string().optional(),
});

export const managerBriefSchema = z.object({
  dealLabel: z.string(),
  whyTheyBuy: z.string(),
  whyTheyDont: z.array(z.string()),
  intent: z.string(),
  competition: z.string(),
  biggestRisk: z.string(),
  customerCommitment: z.string(),
  nextMove: z.string(),
});

export const followUpSentenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  evidenceSegmentIds: z.array(z.string()),
  supported: z.boolean(),
  kind: z.enum(["factual", "non_factual", "unsupported"]),
  explanation: z.string().optional(),
});

export const followUpEmailSchema = z.object({
  subject: z.string(),
  sentences: z.array(followUpSentenceSchema),
});

export const sentimentPointSchema = z.object({
  id: z.string(),
  startMs: z.number().int(),
  valence: z.number(),
  label: z.string(),
  emotions: z.array(z.string()),
  evidence: evidenceRefSchema,
  /** Commercial-intent axis; never merged with emotion valence. */
  intentValence: z.number().optional(),
});

export const buyerSentimentSchema = z.object({
  overall: z.string(),
  trajectory: z.string(),
  points: z.array(sentimentPointSchema),
  disclaimer: z.string(),
});

export const buyingIntentSchema = z.object({
  summary: z.string(),
  signals: z.array(dealSignalSchema),
});

export const callMetricsSchema = z.object({
  talkRatio: z.object({
    sellerPct: z.number(),
    customerPct: z.number(),
  }),
  longestMonologue: z.object({
    speakerName: z.string(),
    durationMs: z.number(),
  }),
  questionCount: z.number(),
  keywordHits: z.array(z.object({ term: z.string(), count: z.number() })),
  silenceGapCount: z.number().int().optional(),
});

export const summarySchema = z.object({
  headline: z.string(),
  tldr: z.string(),
  detailed: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export const insightSchema = z.object({
  id: z.string(),
  type: z.enum(INSIGHT_TYPES),
  title: z.string(),
  summary: z.string(),
  severity: z.enum(SEVERITIES).optional(),
  confidence: z.number().optional(),
  evidenceStatus: z.enum(EVIDENCE_STATUSES),
  evidence: evidenceRefSchema,
  payload: z.record(z.unknown()).optional(),
});

export const callScoreSchema = z.object({
  score: z.number(),
  label: z.string(),
  summary: z.string(),
});

export const outlineSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  startMs: z.number().int(),
  endMs: z.number().int(),
  summary: z.string(),
});

export const callReportSchema = z.object({
  call: callSchema,
  summary: summarySchema,
  dealSignals: z.array(dealSignalSchema),
  customerTruth: z.array(customerFactSchema),
  objections: z.array(objectionSchema),
  commitments: z.array(commitmentSchema),
  risks: z.array(dealRiskSchema),
  competitors: z.array(competitorMentionSchema),
  moments: z.array(callMomentSchema),
  realityChecks: z.array(realityCheckSchema),
  nextCall: battlecardSchema,
  managerBrief: managerBriefSchema,
  followUp: followUpEmailSchema.optional(),
  buyerSentiment: buyerSentimentSchema,
  buyingIntent: buyingIntentSchema,
  metrics: callMetricsSchema,
  unavailableSections: z.array(z.string()).optional(),
  /** ASSUMPTION: conversation quality score, not close probability. Optional for older APIs. */
  callScore: callScoreSchema.optional(),
  /** ASSUMPTION: structured outline. If omitted, UI derives from moments. */
  outline: z.array(outlineSectionSchema).optional(),
});

export const processingEventSchema = z.object({
  id: z.string(),
  callId: z.string().optional(),
  stage: z.enum(CALL_STATUSES),
  state: z.enum(["started", "succeeded", "failed", "skipped"]),
  attempt: z.number().int().optional(),
  errorCode: z.string().optional(),
  message: z.string(),
  createdAt: z.string(),
});

export const processingSnapshotSchema = z.object({
  callId: z.string(),
  status: z.enum(CALL_STATUSES),
  events: z.array(processingEventSchema),
});

export const searchResultSchema = z.object({
  id: z.string(),
  kind: z.enum(SEARCH_RESULT_KINDS),
  callId: z.string(),
  callTitle: z.string(),
  title: z.string(),
  snippet: z.string(),
  insightType: z.enum(INSIGHT_TYPES).optional(),
  evidence: evidenceRefSchema.optional(),
  startMs: z.number().int().optional(),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  groups: z.object({
    insights: z.array(searchResultSchema),
    segments: z.array(searchResultSchema),
    calls: z.array(searchResultSchema),
  }),
  total: z.number().int(),
});

export const recommendationSchema = z.object({
  id: z.string(),
  kind: z.enum(RECOMMENDATION_KINDS),
  title: z.string(),
  description: z.string(),
  count: z.number().int(),
  query: z.string(),
  callIds: z.array(z.string()),
});

export const recommendationsResponseSchema = z.object({
  items: z.array(recommendationSchema),
  available: z.boolean(),
});

export const ASK_MODES = [
  "retrieval",
  "generated",
  "retrieval_generation_dropped",
  "retrieval_generation_failed",
  "retrieval_lexical_fallback",
  "no_index",
] as const;

export const askAnswerSchema = z.object({
  question: z.string(),
  synthesis: z.string().optional(),
  mode: z.enum(ASK_MODES).optional(),
  moments: z.array(
    z.object({
      title: z.string(),
      snippet: z.string(),
      evidence: evidenceRefSchema,
    }),
  ),
});

export const shareLinkSchema = z.object({
  id: z.string(),
  token: z.string(),
  url: z.string(),
  expiresAt: z.string().optional(),
});

export const sharedReportSchema = z.object({
  report: callReportSchema,
  transcript: transcriptSchema,
});
