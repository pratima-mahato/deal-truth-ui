import { type RecommendationsResponse } from "../contracts";
import { apiClient } from "../client";
import { mapRecommendations } from "../adapters";
import { isMissingEndpoint, recommendationsFromLoadedCalls } from "./localIntelligence";

/** Live GET /api/v1/recommendations is snake_case. 404 degrades to a derived list. */
export async function listRecommendations(): Promise<RecommendationsResponse> {
  try {
    return mapRecommendations(await apiClient.get("/api/v1/recommendations"));
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return recommendationsFromLoadedCalls();
    }
    throw error;
  }
}
