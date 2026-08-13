import { cn, formatClock } from "@/lib/utils";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import type { OutlineSection, Transcript } from "@/api/contracts";

export function OutlineView({
  sections,
  durationMs,
  transcript,
}: {
  sections: OutlineSection[];
  durationMs: number;
  transcript: Transcript;
}) {
  const { playFrom, currentMs } = useAudioPlayer();
  const { setFocus } = useEvidenceFocus();

  return (
    <div className="grid gap-8 lg:grid-cols-[12px_minmax(0,1fr)]">
      <div className="relative hidden lg:block">
        <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-violet-100" />
        {sections.map((section) => (
          <span
            key={section.id}
            className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-violet-500"
            style={{ top: `${(section.startMs / Math.max(durationMs, 1)) * 100}%` }}
          />
        ))}
      </div>
      <ol className="space-y-1">
        {sections.map((section) => {
          const active = currentMs >= section.startMs && currentMs < section.endMs;
          return (
            <li key={section.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-4 rounded-xl px-3 py-3 text-left transition",
                  active ? "bg-violet-50" : "hover:bg-white",
                )}
                onClick={() => {
                  const nearest =
                    transcript.segments.find((s) => section.startMs >= s.startMs && section.startMs <= s.endMs) ??
                    transcript.segments.reduce((best, s) =>
                      Math.abs(s.startMs - section.startMs) < Math.abs(best.startMs - section.startMs) ? s : best,
                    );
                  setFocus({ insightId: section.id, segmentIds: nearest ? [nearest.id] : [], play: true });
                  void playFrom(section.startMs);
                }}
              >
                <span className="w-14 shrink-0 font-mono text-xs text-ink-400">{formatClock(section.startMs)}</span>
                <span>
                  <span className="block text-sm font-semibold text-ink-900">{section.title}</span>
                  <span className="mt-1 block text-sm text-ink-500">{section.summary}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
