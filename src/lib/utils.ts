export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function resolveCallDurationMs(
  callDurationMs?: number,
  transcript?: { durationMs?: number; segments?: { startMs: number; endMs: number }[] },
): number {
  const fromCall = callDurationMs && callDurationMs > 0 ? callDurationMs : 0;
  const fromTranscript = transcript?.durationMs && transcript.durationMs > 0 ? transcript.durationMs : 0;
  const fromSegments = transcript?.segments?.length
    ? Math.max(0, ...transcript.segments.map((segment) => Math.max(segment.endMs || 0, segment.startMs || 0)))
    : 0;
  return Math.max(fromCall, fromTranscript, fromSegments);
}

export function formatClock(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00";
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDuration(ms: number): string {
  if (!ms) return "—";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function highlightText(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return parts.filter(Boolean).map((part) => ({ text: part, hit: part.toLowerCase() === q.toLowerCase() }));
}

export function speakerName(
  speakers: { id: string; displayName: string }[],
  speakerId: string,
): string {
  return speakers.find((s) => s.id === speakerId)?.displayName ?? speakerId;
}
