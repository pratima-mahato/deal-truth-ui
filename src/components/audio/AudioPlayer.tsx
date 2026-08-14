import { Pause, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import { formatClock } from "@/lib/utils";
import { useAudioPlayer } from "./AudioPlayerProvider";
import { Waveform } from "./Waveform";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import type { CallMoment, Transcript } from "@/api/contracts";

const SPEEDS = [1, 1.25, 1.5, 2];

const MOMENT_ICONS: Record<string, string> = {
  pain: "⚡",
  pricing: "$",
  buying_signal: "↑",
  competitor: "⚔",
  security: "▣",
  next_step: "→",
};

export function AudioPlayer({
  moments = [],
  transcript,
  seed,
  onMomentClick,
  talkRatio,
}: {
  moments?: CallMoment[];
  transcript?: Transcript;
  seed?: string;
  onMomentClick?: (moment: CallMoment) => void;
  talkRatio?: { sellerPct: number; customerPct: number };
}) {
  const {
    playing,
    currentMs,
    durationMs,
    playbackRate,
    toggle,
    skip,
    seekTo,
    playFrom,
    setPlaybackRate,
    setVolume,
    volume,
    activeRange,
  } = useAudioPlayer();
  const duration = durationMs || 1;

  return (
    <div className="card pad" style={{ flex: "0 0 auto" }}>
      <div className="between" style={{ marginBottom: 9 }}>
        <span className="eyebrow">The recording</span>
        <span className="mono tiny">
          {formatClock(currentMs)} / {formatClock(durationMs)}
        </span>
      </div>
      <Waveform
        durationMs={durationMs}
        currentMs={currentMs}
        seed={seed ?? "call"}
        playing={playing}
        evidenceStartMs={activeRange?.startMs}
        evidenceEndMs={activeRange?.endMs}
        onSeek={(ms) => {
          seekTo(ms);
          void playFrom(ms);
        }}
      />
      <div className="lane" style={{ height: 38 }}>
        {moments.map((moment, index) => (
          <button
            key={moment.id}
            type="button"
            className="lane-tick"
            style={{ left: `${(moment.startMs / duration) * 100}%`, top: index % 2 ? 19 : 0 }}
            title={`${moment.label} · ${formatClock(moment.startMs)}`}
            onClick={() => onMomentClick?.(moment)}
          >
            {MOMENT_ICONS[moment.kind] ?? "•"}
          </button>
        ))}
      </div>
      {transcript ? (
        <div className="speaker-lane">
          {transcript.segments.map((segment) => {
            const speaker = transcript.speakers.find((s) => s.id === segment.speakerId);
            return (
              <i
                key={segment.id}
                style={{
                  flex: Math.max(1, segment.endMs - segment.startMs),
                  background: speaker?.role === "customer" ? "var(--proof)" : "var(--brand)",
                  opacity: 0.55,
                }}
              />
            );
          })}
        </div>
      ) : null}
      <div className="tiny" style={{ marginTop: 9, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span>
          <i className="dot" style={{ display: "inline-block", color: "var(--brand)" }} /> rep
          {talkRatio ? ` ${Math.round(talkRatio.sellerPct)}%` : ""}
        </span>
        <span>
          <i className="dot" style={{ display: "inline-block", color: "var(--proof)" }} /> customer
          {talkRatio ? ` ${Math.round(talkRatio.customerPct)}%` : ""}
        </span>
        <span style={{ color: "var(--text-3)" }}>click the wave or a marker to hear it</span>
      </div>
      <div className="hstack" style={{ marginTop: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn sm" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <PlayGlyph />}
        </button>
        <button type="button" className="btn sm ghost" aria-label="Back 15 seconds" onClick={() => skip(-15000)}>
          <RotateCcw className="h-3.5 w-3.5" />
          15
        </button>
        <button type="button" className="btn sm ghost" aria-label="Forward 15 seconds" onClick={() => skip(15000)}>
          <RotateCw className="h-3.5 w-3.5" />
          15
        </button>
        <button
          type="button"
          className="btn sm ghost mono"
          onClick={() => {
            const i = SPEEDS.indexOf(playbackRate);
            setPlaybackRate(SPEEDS[(i + 1) % SPEEDS.length]);
          }}
        >
          {playbackRate}x
        </button>
        <span className="hstack" style={{ color: "var(--text-3)" }}>
          <Volume2 className="h-4 w-4" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            aria-label="Volume"
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </span>
      </div>
    </div>
  );
}
