import { useState } from "react";
import { formatBytes } from "@/lib/utils";
import { LiveWaveform } from "@/components/audio/Waveform";
import { env } from "@/config/env";

const ALLOWED_EXT = /\.(mp3|wav|m4a|mp4|webm|ogg)$/i;
const MAX_BYTES = 80 * 1024 * 1024;

export function CallDropZone({
  file,
  onFile,
  onAnalyze,
  pending,
  error,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  onAnalyze: () => void;
  pending?: boolean;
  error?: string | null;
}) {
  const [over, setOver] = useState(false);

  function take(next: File | null) {
    if (!next) return;
    if (next.size > MAX_BYTES) return;
    if (next.type && !next.type.startsWith("audio") && !next.type.startsWith("video") && !ALLOWED_EXT.test(next.name)) {
      return;
    }
    onFile(next);
  }

  if (file) {
    return (
      <div className="drop" style={{ marginBottom: 18, cursor: "default" }}>
        <LiveWaveform active={false} />
        <div style={{ fontWeight: 700, margin: "10px 0 4px" }}>{file.name}</div>
        <div className="tiny">{formatBytes(file.size)}</div>
        <div className="hstack" style={{ justifyContent: "center", marginTop: 12 }}>
          <button type="button" className="btn sm" onClick={() => onFile(null)}>
            Choose another
          </button>
          <button type="button" className="btn sm primary" onClick={onAnalyze} disabled={pending}>
            {pending ? "Uploading…" : "Analyse call"}
          </button>
        </div>
        {error ? <p className="tiny" style={{ marginTop: 8, color: "var(--blocker)" }}>{error}</p> : null}
      </div>
    );
  }

  return (
    <label
      className="drop"
      style={{ marginBottom: 18, borderColor: over ? "var(--brand)" : undefined, background: over ? "var(--brand-soft)" : undefined }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files[0] ?? null);
      }}
    >
      <input
        type="file"
        aria-label="Upload a call recording"
        accept=".mp3,.wav,.m4a,.mp4,.webm,.ogg,audio/*,video/mp4"
        onChange={(e) => take(e.target.files?.[0] ?? null)}
      />
      <div className="hstack" style={{ justifyContent: "center", marginBottom: 10 }}>
        <LiveWaveform active={over} />
      </div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Drop a recording, or paste a link</div>
      <div className="tiny">
        mp3 · wav · m4a · webm — up to 80 MB
        {env.useMocks ? ". Sample calls are available in mock mode." : "."}
      </div>
    </label>
  );
}
