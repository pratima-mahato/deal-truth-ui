import { type RecommendationsResponse } from "../contracts";
import { apiClient } from "../client";
import { mapRecommendations } from "../adapters";
import { isMissingEndpoint } from "./localIntelligence";

/** Live GET /api/v1/recommendations. Missing endpoint is an empty unavailable list — not synthesized rows. */
export async function listRecommendations(): Promise<RecommendationsResponse> {
  try {
    return mapRecommendations(await apiClient.get("/api/v1/recommendations"));
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return { available: false, items: [] };
    }
    throw error;
  }
}
