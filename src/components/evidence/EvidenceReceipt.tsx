import { cn, formatClock } from "@/lib/utils";
import { ABSENCE_COPY, stampTone, type StampStatus } from "@/lib/evidence";
import { EvidenceStamp } from "./EvidenceStamp";
import { PlayGlyph, ArrowGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "./EvidenceFocusContext";
import { useAudioPlayerOptional } from "@/components/audio/AudioPlayerProvider";
import type { Transcript, TranscriptSegment } from "@/api/contracts";

export function EvidenceReceipt({
  segment,
  transcript,
  status = "SUPPORTED",
  compact,
  struck,
  code,
  reason,
}: {
  segment?: TranscriptSegment;
  transcript?: Transcript;
  status?: StampStatus;
  compact?: boolean;
  struck?: boolean;
  code?: string;
  reason?: string;
}) {
  const { setFocus, focus } = useEvidenceFocus();
  const audio = useAudioPlayerOptional();
  const currentMs = audio?.currentMs ?? 0;
  const playing = audio?.playing ?? false;
  const activeRange = audio?.activeRange ?? null;
  const tone = stampTone(status);
  const isPlaying =
    playing &&
    !!segment &&
    ((activeRange && currentMs >= activeRange.startMs && currentMs <= activeRange.endMs && focus?.segmentIds.includes(segment.id)) ||
      (focus?.segmentIds.includes(segment.id) && playing));

  const range = activeRange && segment ? activeRange : null;
  const pctDone =
    isPlaying && range && range.endMs > range.startMs
      ? Math.min(1, Math.max(0, (currentMs - range.startMs) / (range.endMs - range.startMs)))
      : 0;

  if (status === "ABSENCE_BASED" || !segment) {
    return (
      <div className="receipt absent">
        <div className="receipt-head">
          <EvidenceStamp status="ABSENCE_BASED" />
        </div>
        <div className="sub" style={{ fontSize: 12.5 }}>
          {ABSENCE_COPY}
        </div>
      </div>
    );
  }

  const speaker = transcript?.speakers.find((s) => s.id === segment.speakerId)?.displayName ?? "Speaker";
  const durationS = Math.max(1, Math.round((segment.endMs - segment.startMs) / 1000));

  return (
    <div className={cn("receipt", tone === "proof" || tone === "blocker" ? undefined : tone, isPlaying && "playing")} data-recseg={segment.id}>
      <div className="receipt-head">
        <EvidenceStamp status={status} />
        <span className="receipt-src mono">
          {formatClock(segment.startMs)} · {speaker}
        </span>
        {code ? <span className="receipt-src mono">{code}</span> : null}
        <span className="grow" />
        <span className="receipt-src mono">seg #{segment.sequenceNumber}</span>
      </div>
      <div className={cn("receipt-q", struck && "strike")}>
        “
        <span className="karaoke" style={{ ["--k" as string]: `${pctDone * 100}%` }}>
          {segment.text}
        </span>
        ”
      </div>
      {reason ? <div className="sub" style={{ fontSize: 12 }}>{reason}</div> : null}
      <div className="receipt-meta">
        <button
          type="button"
          className="btn sm play"
          aria-label={`Play evidence, ${speaker} at ${formatClock(segment.startMs)}`}
          onClick={() => {
            setFocus({ insightId: segment.id, segmentIds: [segment.id], play: true });
            void audio?.playRange(segment.startMs, segment.endMs);
          }}
        >
          <PlayGlyph />
          <span>Play {durationS}s</span>
        </button>
        {compact ? null : (
          <button
            type="button"
            className="btn sm ghost"
            onClick={() => setFocus({ insightId: segment.id, segmentIds: [segment.id], play: false })}
          >
            Show in transcript <ArrowGlyph />
          </button>
        )}
      </div>
    </div>
  );
}
