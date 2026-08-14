import { formatClock } from "@/lib/utils";
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
    <div className="vstack" style={{ gap: 4 }}>
      {sections.map((section) => {
        const active = currentMs >= section.startMs && currentMs < section.endMs;
        return (
          <button
            key={section.id}
            type="button"
            className="between"
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 11,
              background: active ? "var(--brand-soft)" : "transparent",
            }}
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
            <span>
              <span style={{ fontWeight: 800, fontSize: 13, display: "block" }}>{section.title}</span>
              <span className="tiny">{section.summary}</span>
            </span>
            <span className="mono tiny">{formatClock(section.startMs)}</span>
          </button>
        );
      })}
      <p className="tiny">Duration {formatClock(durationMs)}</p>
    </div>
  );
}
