import { shareLinkSchema, type SharedReport, type ShareLink } from "../contracts";
import { apiClient } from "../client";
import { mapShareLink, mapShared } from "../adapters";

export async function createShareLink(callId: string, ttlSeconds = 86400): Promise<ShareLink> {
  return shareLinkSchema.parse(mapShareLink(await apiClient.post(`/api/v1/calls/${callId}/share`, { ttl_seconds: ttlSeconds })));
}

export function sharedViewUrl(link: ShareLink, origin = window.location.origin): string {
  const path = link.url.startsWith("/shared/")
    ? link.url
    : link.token
      ? `/shared/${encodeURIComponent(link.token)}`
      : "";
  return path ? `${origin}${path}` : "";
}

export async function getSharedReport(token: string): Promise<SharedReport> {
  const safe = encodeURIComponent(token);
  return mapShared(await apiClient.get(`/api/v1/shared/${safe}`));
}

export async function revokeShare(callId: string, shareId: string): Promise<void> {
  await apiClient.delete(`/api/v1/calls/${callId}/share/${shareId}`);
}
