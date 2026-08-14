import { z } from "zod";
import { apiClient, apiUrl } from "../client";
import { env } from "@/config/env";
import {
  insightSchema,
  isReportReadyStatus,
  type Call,
  type CallReport,
  type CallRefusals,
  type CallsOverview,
  type CreateCallRequest,
  type Insight,
  type ListCallsParams,
  type ProcessingEvent,
  type ProcessingSnapshot,
} from "../contracts";
import {
  mapAudioUrl,
  mapCall,
  mapCallList,
  mapCallsOverview,
  mapEventList,
  mapInsights,
  mapRefusals,
  mapReport,
  toCreateCallBody,
} from "../adapters";

export async function listCalls(_params: ListCallsParams = {}): Promise<{ items: Call[]; total: number }> {
  const data = await apiClient.get<unknown>("/api/v1/calls");
  return mapCallList(data);
}

export async function getCall(callId: string): Promise<Call> {
  return mapCall(await apiClient.get(`/api/v1/calls/${callId}`));
}

export async function createCall(input: CreateCallRequest): Promise<Call> {
  return mapCall(await apiClient.post("/api/v1/calls", toCreateCallBody(input)));
}

export async function deleteCall(callId: string): Promise<void> {
  await apiClient.delete(`/api/v1/calls/${callId}`);
}

export async function uploadCallAudio(callId: string, file: File): Promise<Call> {
  const form = new FormData();
  form.append("file", file);
  return mapCall(await apiClient.postForm(`/api/v1/calls/${callId}/audio`, form));
}

export async function registerSourceUrl(callId: string, sourceUrl: string): Promise<Call> {
  return mapCall(await apiClient.post(`/api/v1/calls/${callId}/source-url`, { url: sourceUrl }));
}

export async function processCall(callId: string): Promise<Call> {
  return mapCall(await apiClient.post(`/api/v1/calls/${callId}/process`));
}

export async function reanalyzeCall(callId: string): Promise<Call> {
  return mapCall(await apiClient.post(`/api/v1/calls/${callId}/reanalyze`));
}

export async function cancelCall(callId: string): Promise<Call> {
  return mapCall(await apiClient.post(`/api/v1/calls/${callId}/cancel`));
}

export async function getCallReport(callId: string): Promise<CallReport> {
  return mapReport(await apiClient.get(`/api/v1/calls/${callId}/report`));
}

export async function getCallInsights(callId: string): Promise<Insight[]> {
  const data = await apiClient.get<unknown>(`/api/v1/calls/${callId}/insights`);
  const mapped = mapInsights(data);
  return z.array(insightSchema).parse(mapped);
}

export async function getCallEvents(callId: string): Promise<ProcessingEvent[]> {
  return mapEventList(await apiClient.get(`/api/v1/calls/${callId}/events`), callId);
}

export async function getProcessingSnapshot(callId: string): Promise<ProcessingSnapshot> {
  const [call, events] = await Promise.all([getCall(callId), getCallEvents(callId)]);
  return { callId, status: call.status, events };
}

export function callAudioUrl(callId: string): string {
  const url = new URL(apiUrl(`/api/v1/calls/${callId}/audio`), typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (env.skipNgrokWarning) url.searchParams.set("ngrok-skip-browser-warning", "true");
  return url.toString();
}

export async function getCallAudioUrl(callId: string): Promise<string> {
  const signed = mapAudioUrl(await apiClient.get(`/api/v1/calls/${callId}/audio-url`));
  return signed || callAudioUrl(callId);
}

export async function resolveCallAudioSrc(callId: string): Promise<string> {
  try {
    return await getCallAudioUrl(callId);
  } catch {
    return callAudioUrl(callId);
  }
}

export async function getCallRefusals(callId: string): Promise<CallRefusals> {
  return mapRefusals(await apiClient.get(`/api/v1/calls/${callId}/refusals`), callId);
}

export async function getCallsOverview(): Promise<CallsOverview> {
  const overview = mapCallsOverview(await apiClient.get("/api/v1/calls/overview"));
  const ready = overview.recentCalls.filter((call) => isReportReadyStatus(call.status));
  if (!ready.length) return overview;
  const rows = await Promise.all(ready.slice(0, 10).map((call) => getCallRefusals(call.id).catch(() => null)));
  const refusedCount = rows.reduce((sum, row) => sum + (row?.refusedCount ?? 0), 0);
  return { ...overview, refusedCount };
}

export async function downloadCallExport(callId: string, format: "json" | "markdown"): Promise<void> {
  const path = format === "json" ? `/api/v1/calls/${callId}/export/json` : `/api/v1/calls/${callId}/export/markdown`;
  const blob = await apiClient.getBlob(path);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = format === "json" ? `call-${callId}.json` : `call-${callId}.md`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
