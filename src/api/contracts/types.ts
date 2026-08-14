import type { z } from "zod";
import type {
  apiErrorSchema,
  askAnswerSchema,
  battlecardSchema,
  buyerSentimentSchema,
  buyingIntentSchema,
  callMetricsSchema,
  callMomentSchema,
  callReportSchema,
  callSchema,
  callScoreSchema,
  outlineSectionSchema,
  commitmentSchema,
  competitorMentionSchema,
  customerFactSchema,
  dealRiskSchema,
  dealSignalSchema,
  evidenceRefSchema,
  followUpEmailSchema,
  followUpSentenceSchema,
  insightSchema,
  managerBriefSchema,
  objectionSchema,
  paginatedCallsSchema,
  processingEventSchema,
  processingSnapshotSchema,
  realityCheckSchema,
  recommendationSchema,
  recommendationsResponseSchema,
  searchResponseSchema,
  searchResultSchema,
  sentimentPointSchema,
  sharedReportSchema,
  shareLinkSchema,
  refusedClaimSchema,
  callRefusalsSchema,
  dealCallSchema,
  dealDeltaSchema,
  dealSchema,
  callsOverviewSchema,
  slackIntegrationStatusSchema,
  speakerSchema,
  summarySchema,
  transcriptSchema,
  transcriptSegmentSchema,
} from "./schemas";

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;
export type Speaker = z.infer<typeof speakerSchema>;
export type Call = z.infer<typeof callSchema>;
export type CallScore = z.infer<typeof callScoreSchema>;
export type OutlineSection = z.infer<typeof outlineSectionSchema>;
export type PaginatedCalls = z.infer<typeof paginatedCallsSchema>;
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;
export type Transcript = z.infer<typeof transcriptSchema>;
export type DealSignal = z.infer<typeof dealSignalSchema>;
export type CustomerFact = z.infer<typeof customerFactSchema>;
export type Objection = z.infer<typeof objectionSchema>;
export type Commitment = z.infer<typeof commitmentSchema>;
export type DealRisk = z.infer<typeof dealRiskSchema>;
export type CompetitorMention = z.infer<typeof competitorMentionSchema>;
export type CallMoment = z.infer<typeof callMomentSchema>;
export type RealityCheck = z.infer<typeof realityCheckSchema>;
export type Battlecard = z.infer<typeof battlecardSchema>;
export type ManagerBrief = z.infer<typeof managerBriefSchema>;
export type FollowUpSentence = z.infer<typeof followUpSentenceSchema>;
export type FollowUpEmail = z.infer<typeof followUpEmailSchema>;
export type SentimentPoint = z.infer<typeof sentimentPointSchema>;
export type BuyerSentiment = z.infer<typeof buyerSentimentSchema>;
export type BuyingIntent = z.infer<typeof buyingIntentSchema>;
export type CallMetrics = z.infer<typeof callMetricsSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type Insight = z.infer<typeof insightSchema>;
export type CallReport = z.infer<typeof callReportSchema>;
export type ProcessingEvent = z.infer<typeof processingEventSchema>;
export type ProcessingSnapshot = z.infer<typeof processingSnapshotSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecommendationsResponse = z.infer<typeof recommendationsResponseSchema>;
export type AskAnswer = z.infer<typeof askAnswerSchema>;
export type ShareLink = z.infer<typeof shareLinkSchema>;
export type SharedReport = z.infer<typeof sharedReportSchema>;
export type RefusedClaim = z.infer<typeof refusedClaimSchema>;
export type CallRefusals = z.infer<typeof callRefusalsSchema>;
export type DealCall = z.infer<typeof dealCallSchema>;
export type DealDelta = z.infer<typeof dealDeltaSchema>;
export type Deal = z.infer<typeof dealSchema>;
export type CallsOverview = z.infer<typeof callsOverviewSchema>;
export type SlackIntegrationStatus = z.infer<typeof slackIntegrationStatusSchema>;

export type CreateCallRequest = {
  title?: string;
  customerName?: string;
  repName?: string;
  callDirection?: "inbound" | "outbound" | "internal" | "unknown";
  recordingMode?: "mono" | "stereo";
  stereoSellerChannel?: number;
  sourceType?: "upload" | "source_url" | "url" | "sample";
  sourceUrl?: string;
  trackedCompetitors?: string[];
  trackedKeywords?: string[];
};

export type SpeakerPatchRequest = {
  speakerId: string;
  role?: string;
  displayName?: string;
  swapWith?: string;
};

export type ListCallsParams = {
  limit?: number;
  offset?: number;
  status?: string;
};

export type SearchParams = {
  q: string;
  types?: string;
  status?: string;
  from?: string;
  to?: string;
};
