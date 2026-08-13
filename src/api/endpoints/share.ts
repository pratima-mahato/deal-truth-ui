import { shareLinkSchema, type SharedReport, type ShareLink } from "../contracts";
import { apiClient } from "../client";
import { mapShareLink, mapShared } from "../adapters";

export async function createShareLink(callId: string, ttlSeconds = 86400): Promise<ShareLink> {
  return shareLinkSchema.parse(mapShareLink(await apiClient.post(`/api/v1/calls/${callId}/share`, { ttl_seconds: ttlSeconds })));
}

export async function getSharedReport(token: string): Promise<SharedReport> {
  return mapShared(await apiClient.get(`/api/v1/shared/${token}`));
}

export async function revokeShare(callId: string, shareId: string): Promise<void> {
  await apiClient.delete(`/api/v1/calls/${callId}/share/${shareId}`);
}
