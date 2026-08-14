import type { Deal } from "../contracts";
import { apiClient } from "../client";
import { mapDeal } from "../adapters";

export async function getDeal(dealId: string): Promise<Deal> {
  return mapDeal(await apiClient.get(`/api/v1/deals/${encodeURIComponent(dealId)}`));
}
