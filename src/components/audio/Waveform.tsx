function peaksFromSeed(seed: string, count: number): number[] {
  let x = 7;
  for (let i = 0; i < seed.length; i += 1) x = (x * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const base = 0.34 + 0.5 * Math.abs(Math.sin(i / 5.5)) * Math.abs(Math.cos(i / 13));
    out.push(Math.max(0.14, Math.min(1, base * (0.62 + ((x % 1000) / 1000) * 0.72))));
  }
  return out;
}

const WAVE_BARS = 150;

export function Waveform({
  durationMs,
  currentMs,
  seed = "call",
  onSeek,
  evidenceStartMs,
  evidenceEndMs,
  playing,
}: {
  durationMs: number;
  currentMs: number;
  seed?: string;
  onSeek?: (ms: number) => void;
  evidenceStartMs?: number;
  evidenceEndMs?: number;
  playing?: boolean;
  bars?: number;
  className?: string;
}) {
  const peaks = peaksFromSeed(seed, WAVE_BARS);
  const progress = durationMs > 0 ? Math.min(1, currentMs / durationMs) : 0;
  const bandLeft = durationMs > 0 && evidenceStartMs != null ? (evidenceStartMs / durationMs) * 100 : null;
  const bandWidth =
    durationMs > 0 && evidenceStartMs != null && evidenceEndMs != null
      ? ((evidenceEndMs - evidenceStartMs) / durationMs) * 100
      : null;

  return (
    <div
      className={playing ? "wave tall live" : "wave tall"}
      id="waveMain"
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
        const active = index / WAVE_BARS <= progress;
        const near = Math.abs(index / WAVE_BARS - progress) < 0.02;
        return (
          <b
            key={index}
            className={active ? (near ? "on near" : "on") : undefined}
            style={{ height: `${Math.round(peak * 100)}%` }}
          />
        );
      })}
      <div className="playhead" id="playhead" style={{ left: `${progress * 100}%` }} />
      {bandLeft != null && bandWidth != null ? (
        <div className="evidence-band" style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }} />
      ) : null}
    </div>
  );
}

export function LiveWaveform({ active }: { active: boolean }) {
  return (
    <span className="livewave" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${(i * 0.07).toFixed(2)}s`, opacity: active ? 1 : 0.45 }} />
      ))}
    </span>
  );
}
