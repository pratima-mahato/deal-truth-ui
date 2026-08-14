import { DEAL_DIMENSION_IDS, type Call, type CallReport, type Deal, type FollowUpEmail, type Insight, type ProcessingSnapshot, type Transcript } from "@/api/contracts";

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

function toWireSignalPips(pips: Call["signalPips"]): Record<string, string> {
  const states = pips ?? [];
  return Object.fromEntries(DEAL_DIMENSION_IDS.map((id, index) => [id, states[index] ?? "missing"]));
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
    deal_id: call.dealId ?? null,
    top_risk: call.biggestRisk ?? null,
    biggest_risk: call.biggestRisk ?? null,
    signal_badges: call.signalBadges ?? [],
    signal_pips: toWireSignalPips(call.signalPips),
  };
}

export function toWireDeal(deal: Deal): Record<string, unknown> {
  return {
    id: deal.id,
    account_name: deal.accountName,
    primary_contact: deal.primaryContact ?? null,
    rep_name: deal.repName ?? null,
    call_count: deal.callCount,
    span_days: deal.spanDays,
    calls: deal.calls.map((call) => ({
      call_id: call.callId,
      title: call.title,
      created_at: call.createdAt,
      duration_ms: call.durationMs,
      dimension_states: call.states,
    })),
    deltas: deal.deltas.map((delta) => ({
      dimension: delta.dimension,
      from: delta.from,
      to: delta.to,
      call_id: delta.callId ?? null,
      note: delta.note ?? null,
    })),
  };
}

export function toWireRefusals(refusals: { callId: string; refusedCount: number; shippedCount: number; refusals: Array<{ id: string; code: string; claim: string; why: string; insightType?: string }> }): Record<string, unknown> {
  return {
    call_id: refusals.callId,
    refused_count: refusals.refusedCount,
    shipped_count: refusals.shippedCount,
    refusals: refusals.refusals.map((row) => ({
      id: row.id,
      insight_type: row.insightType ?? null,
      title: row.claim,
      error_code: row.code,
      drop_reason: row.why,
    })),
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
