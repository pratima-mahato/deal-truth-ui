import { Pause, Play, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatClock } from "@/lib/utils";
import { useAudioPlayer } from "./AudioPlayerProvider";
import { Waveform } from "./Waveform";
import type { CallMoment, Transcript } from "@/api/contracts";

const SPEEDS = [1, 1.25, 1.5, 2];

export function AudioPlayer({
  moments = [],
  transcript,
  seed,
  onMomentClick,
}: {
  moments?: CallMoment[];
  transcript?: Transcript;
  seed?: string;
  onMomentClick?: (moment: CallMoment) => void;
}) {
  const { playing, currentMs, durationMs, playbackRate, toggle, skip, seekTo, playFrom, setPlaybackRate, setVolume, volume } =
    useAudioPlayer();
  const speakers = transcript?.speakers ?? [];
  const duration = durationMs || 1;

  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-4 shadow-card">
      <Waveform
        durationMs={durationMs}
        currentMs={currentMs}
        seed={seed ?? "call"}
        onSeek={(ms) => {
          seekTo(ms);
          void playFrom(ms);
        }}
      />
      {speakers.length > 0 && transcript ? (
        <div className="mt-3 space-y-1.5">
          {speakers.map((speaker) => (
            <div key={speaker.id} className="flex items-center gap-2">
              <span className="w-28 truncate text-[11px] font-medium text-ink-500">{speaker.displayName}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                {transcript.segments
                  .filter((s) => s.speakerId === speaker.id)
                  .map((segment) => (
                    <span
                      key={segment.id}
                      className={speaker.role === "seller" ? "absolute inset-y-0 bg-violet-400" : "absolute inset-y-0 bg-emerald-400"}
                      style={{
                        left: `${(segment.startMs / duration) * 100}%`,
                        width: `${Math.max(0.4, ((segment.endMs - segment.startMs) / duration) * 100)}%`,
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
          {moments.length ? (
            <div className="flex items-center gap-2">
              <span className="w-28 text-[11px] font-medium text-ink-500">Topics</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                {moments.map((moment) => (
                  <button
                    key={moment.id}
                    type="button"
                    title={moment.label}
                    className="absolute inset-y-0 rounded-full bg-amber-400"
                    style={{ left: `${(moment.startMs / duration) * 100}%`, width: "2.5%" }}
                    onClick={() => onMomentClick?.(moment)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" aria-label="Back 15 seconds" onClick={() => skip(-15000)}>
          <RotateCcw className="h-4 w-4" />
          15
        </Button>
        <Button size="sm" variant="ghost" aria-label="Forward 15 seconds" onClick={() => skip(15000)}>
          <RotateCw className="h-4 w-4" />
          15
        </Button>
        <button
          type="button"
          className="rounded-md px-2 py-1 font-mono text-xs text-ink-600 hover:bg-violet-50"
          onClick={() => {
            const i = SPEEDS.indexOf(playbackRate);
            setPlaybackRate(SPEEDS[(i + 1) % SPEEDS.length]);
          }}
        >
          {playbackRate}x
        </button>
        <div className="flex items-center gap-2 text-ink-400">
          <Volume2 className="h-4 w-4" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            aria-label="Volume"
            className="w-20 accent-violet-600"
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
        <div className="ml-auto font-mono text-xs text-ink-500">
          {formatClock(currentMs)} / {formatClock(durationMs)}
        </div>
      </div>
    </div>
  );
}
