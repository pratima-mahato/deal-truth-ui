import { searchResponseSchema, type SearchParams, type SearchResponse } from "../contracts";
import { apiClient } from "../client";
import { isMissingEndpoint, searchFromLoadedCalls } from "./localIntelligence";

/** Prompt 2 does not currently expose GET /api/v1/search. 404 degrades to client-side search. */
export async function searchIntelligence(params: SearchParams): Promise<SearchResponse> {
  const search = new URLSearchParams();
  search.set("q", params.q);
  if (params.types) search.set("types", params.types);
  if (params.status) search.set("status", params.status);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  try {
    return searchResponseSchema.parse(await apiClient.get(`/api/v1/search?${search.toString()}`));
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return searchFromLoadedCalls(params.q);
    }
    throw error;
  }
}
