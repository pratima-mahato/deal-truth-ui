import type { CallMoment, CompetitorMention, Transcript } from "@/api/contracts";
import { formatClock } from "@/lib/utils";
import { EvidenceReceipt } from "@/components/evidence/EvidenceReceipt";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { useAudioPlayerOptional } from "@/components/audio/AudioPlayerProvider";
import { resolveSegment } from "@/lib/evidence";

const ICONS: Record<string, string> = {
  pain: "⚡",
  pricing: "$",
  buying_signal: "↑",
  competitor: "⚔",
  security: "▣",
  next_step: "→",
};

export function MomentsTimeline({
  moments,
  durationMs,
}: {
  moments: CallMoment[];
  durationMs?: number;
}) {
  const { setFocus } = useEvidenceFocus();
  const audio = useAudioPlayerOptional();
  const span = durationMs && durationMs > 0 ? durationMs : Math.max(...moments.map((m) => m.startMs), 1);
  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 12 }}>
        <span className="h-sec">Moments that mattered</span>
        <span className="chip">click to hear it</span>
      </div>
      <div className="vstack" style={{ gap: 7 }}>
        {moments.map((moment) => (
          <button
            key={moment.id}
            type="button"
            className="between"
            style={{
              width: "100%",
              textAlign: "left",
              padding: "9px 11px",
              border: "1px solid var(--line)",
              borderRadius: 11,
              background: "var(--surface-2)",
            }}
            onClick={() => {
              setFocus({ insightId: moment.id, segmentIds: moment.evidence.segmentIds, play: true });
              const end = moment.startMs + 4000;
              void audio?.playRange(moment.startMs, end);
            }}
          >
            <span className="hstack">
              <span style={{ width: 26, textAlign: "center", fontSize: 14 }}>{ICONS[moment.kind] ?? "•"}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{moment.label}</span>
            </span>
            <span className="hstack">
              <span className="mono tiny">{formatClock(moment.startMs)}</span>
              <span className="btn sm play" aria-hidden>
                <PlayGlyph />
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="tiny" style={{ marginTop: 10, color: "var(--text-3)" }}>
        Timeline span {formatClock(span)} — ticks are placed by call duration, not by the last moment.
      </div>
    </div>
  );
}

export function CompetitorsSection({
  competitors,
  transcript,
}: {
  competitors: CompetitorMention[];
  transcript?: Transcript;
}) {
  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 12 }}>
        <span className="h-sec">Competitors</span>
        <span className="tiny">named by the customer, with receipts</span>
      </div>
      {competitors.length === 0 ? (
        <p className="sub">No competitors mentioned with evidence.</p>
      ) : (
        <div className="vstack" style={{ gap: 12 }}>
          {competitors.map((item) => {
            const segment = transcript ? resolveSegment(transcript, item.evidence.segmentIds[0]) : undefined;
            return (
              <article key={item.id} className="card pad" style={{ boxShadow: "none" }}>
                <div className="between" style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</span>
                  <span className="chip unproven">{item.stance}</span>
                </div>
                <div className="split">
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>
                      They like
                    </div>
                    <div className="sub">{item.likes?.join(" · ") || "—"}</div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>
                      They doubt
                    </div>
                    <div className="sub">{item.concerns?.join(" · ") || "—"}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <EvidenceReceipt segment={segment} transcript={transcript} compact />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
