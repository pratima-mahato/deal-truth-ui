import type { Call, CallReport, FollowUpEmail, Insight, ProcessingSnapshot, Transcript } from "@/api/contracts";

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

export function toSnakeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toSnakeKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [camelToSnake(key), toSnakeKeys(nested)]),
    );
  }
  return value;
}

export function toWireCall(call: Call): Record<string, unknown> {
  const sourceType = call.sourceType === "url" ? "source_url" : call.sourceType === "sample" ? "upload" : call.sourceType;
  return {
    id: call.id,
    public_call_id: call.id,
    title: call.title,
    customer_name: call.customerName,
    status: call.status,
    terminal_outcome: call.terminalOutcome ?? null,
    duration_ms: call.durationMs,
    created_at: call.createdAt,
    updated_at: call.updatedAt,
    rep_name: call.repName,
    call_direction: call.callDirection,
    source_type: sourceType === "source_url" ? "source_url" : "upload",
    recording_mode: "mono",
    failure_kind: call.failureKind ?? null,
    language: call.language,
    completed_at: call.completedAt ?? null,
  };
}

export function toWireTranscript(transcript: Transcript): Record<string, unknown> {
  return {
    call_id: transcript.callId,
    language: transcript.language,
    duration_ms: transcript.durationMs ?? transcript.segments.at(-1)?.endMs ?? null,
    speakers: transcript.speakers.map((speaker) => ({
      id: speaker.id,
      provider_speaker_id: speaker.providerSpeakerId,
      role: speaker.role,
      display_name: speaker.displayName,
      confidence: speaker.confidence ?? 0,
      manually_overridden: speaker.manuallyOverridden ?? false,
    })),
    segments: transcript.segments.map((segment) => ({
      id: String(segment.id),
      speaker_id: segment.speakerId,
      speaker_role: transcript.speakers.find((s) => s.id === segment.speakerId)?.role ?? null,
      start_ms: segment.startMs,
      end_ms: segment.endMs,
      text: segment.text,
      sequence_number: segment.sequenceNumber,
    })),
  };
}

export function toWireEvents(snapshot: ProcessingSnapshot): Record<string, unknown>[] {
  return snapshot.events.map((event) => ({
    id: event.id,
    stage: event.stage,
    state: event.state,
    attempt: event.attempt ?? 1,
    error_code: event.errorCode ?? null,
    message: event.message,
    created_at: event.createdAt,
  }));
}

export function toWireReport(report: CallReport): Record<string, unknown> {
  return toSnakeKeys({
    ...report,
    call: toWireCall(report.call),
  }) as Record<string, unknown>;
}

export function toWireInsights(insights: Insight[]): Record<string, unknown>[] {
  return toSnakeKeys(insights) as Record<string, unknown>[];
}

export function toWireFollowUp(email: FollowUpEmail): Record<string, unknown> {
  return toSnakeKeys(email) as Record<string, unknown>;
}

export function toWireShare(link: { id: string; token: string; url: string; expiresAt?: string }): Record<string, unknown> {
  return {
    id: link.id,
    token: link.token,
    url: link.url,
    expires_at: link.expiresAt ?? new Date(Date.now() + 86400000).toISOString(),
  };
}

export function toWireAsk(answer: unknown): Record<string, unknown> {
  return toSnakeKeys(answer) as Record<string, unknown>;
}
