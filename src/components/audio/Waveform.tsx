import { cn } from "@/lib/utils";

function peaksFromSeed(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: count }, (_, i) => {
    const n = Math.sin(hash / 1000 + i * 0.37) * 0.5 + Math.sin(i * 0.13) * 0.5;
    return 0.18 + Math.abs(n) * 0.82;
  });
}

export function Waveform({
  durationMs,
  currentMs,
  seed = "call",
  onSeek,
  bars = 96,
  className,
}: {
  durationMs: number;
  currentMs: number;
  seed?: string;
  onSeek?: (ms: number) => void;
  bars?: number;
  className?: string;
}) {
  const peaks = peaksFromSeed(seed, bars);
  const progress = durationMs > 0 ? Math.min(1, currentMs / durationMs) : 0;

  return (
    <div
      className={cn("flex h-12 cursor-pointer items-end gap-px", className)}
      role="slider"
      aria-label="Call waveform"
      aria-valuemin={0}
      aria-valuemax={durationMs}
      aria-valuenow={currentMs}
      onClick={(e) => {
        if (!onSeek || !durationMs) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        onSeek(ratio * durationMs);
      }}
    >
      {peaks.map((peak, index) => {
        const active = index / bars <= progress;
        return (
          <span
            key={index}
            className={cn("w-full rounded-sm", active ? "bg-violet-500" : "bg-violet-200")}
            style={{ height: `${Math.round(peak * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

export function LiveWaveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-16 items-end justify-center gap-1" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-full bg-violet-500", active && "animate-bar-pulse")}
          style={{
            height: `${20 + ((i * 13) % 70)}%`,
            animationDelay: `${(i % 8) * 80}ms`,
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}
