import { recommendationsResponseSchema, type RecommendationsResponse } from "../contracts";
import { apiClient } from "../client";
import { isMissingEndpoint, recommendationsFromLoadedCalls } from "./localIntelligence";

/** Prompt 2 does not currently expose GET /api/v1/recommendations. 404 degrades to a derived list. */
export async function listRecommendations(): Promise<RecommendationsResponse> {
  try {
    return recommendationsResponseSchema.parse(await apiClient.get("/api/v1/recommendations"));
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return recommendationsFromLoadedCalls();
    }
    throw error;
  }
}
