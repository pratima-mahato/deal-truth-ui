import { searchResponseSchema, type SearchParams, type SearchResponse } from "../contracts";
import { apiClient } from "../client";
import { mapSearchResponse } from "../adapters";

/** Prompt 2 search may return grouped results or a bare `{ segments: [...] }` payload. */
export async function searchIntelligence(params: SearchParams): Promise<SearchResponse> {
  const search = new URLSearchParams();
  search.set("q", params.q);
  if (params.types) search.set("types", params.types);
  if (params.status) search.set("status", params.status);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const mapped = mapSearchResponse(await apiClient.get(`/api/v1/search?${search.toString()}`), params.q);
  return searchResponseSchema.parse(mapped);
}
