import { useState } from "react";
import { formatBytes } from "@/lib/utils";
import { LiveWaveform } from "@/components/audio/Waveform";
import { env } from "@/config/env";
import { FORMAT_ACCEPT, FORMAT_HINT, MAX_UPLOAD_LABEL, validateAudioFile } from "./constants";

export function CallDropZone({
  file,
  onFile,
  onAnalyze,
  pending,
  error,
  headline = "Drop a recording, or click to browse",
  showAnalyze = true,
  showError = true,
  onReject,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  onAnalyze?: () => void;
  pending?: boolean;
  error?: string | null;
  headline?: string;
  showAnalyze?: boolean;
  showError?: boolean;
  onReject?: (message: string | null) => void;
}) {
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const visibleError = error || localError;

  function take(next: File | null) {
    if (!next) return;
    const result = validateAudioFile(next);
    if (!result.ok) {
      setLocalError(result.message);
      onReject?.(result.message);
      return;
    }
    setLocalError(null);
    onReject?.(null);
    onFile(next);
  }

  function clear() {
    setLocalError(null);
    onReject?.(null);
    onFile(null);
  }

  if (file) {
    return (
      <div className="drop ready" style={{ cursor: "default" }}>
        <LiveWaveform active={false} />
        <div style={{ fontWeight: 700, margin: "10px 0 4px" }}>{file.name}</div>
        <div className="tiny">{formatBytes(file.size)}</div>
        <div className="hstack" style={{ justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
          <span className="chip proof">Ready</span>
          <button type="button" className="btn sm" onClick={clear} disabled={pending}>
            Choose another
          </button>
          {showAnalyze && onAnalyze ? (
            <button type="button" className="btn sm primary" onClick={onAnalyze} disabled={pending}>
              {pending ? "Uploading…" : "Analyse call"}
            </button>
          ) : null}
        </div>
        {showError && visibleError ? (
          <p className="tiny" style={{ marginTop: 8, color: "var(--blocker)" }}>
            {visibleError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <label
      className="drop"
      style={{ borderColor: over ? "var(--brand)" : undefined, background: over ? "var(--brand-soft)" : undefined }}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files[0] ?? null);
      }}
    >
      <input
        type="file"
        aria-label="Upload a call recording"
        accept={FORMAT_ACCEPT}
        onChange={(event) => {
          take(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <div className="hstack" style={{ justifyContent: "center", marginBottom: 10 }}>
        <LiveWaveform active={over} />
      </div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{headline}</div>
      <div className="tiny">
        {FORMAT_HINT} — up to {MAX_UPLOAD_LABEL}
        {env.useMocks ? ". Sample calls are available in mock mode." : "."}
      </div>
      {showError && visibleError ? (
        <p className="tiny" style={{ marginTop: 8, color: "var(--blocker)" }} role="alert">
          {visibleError}
        </p>
      ) : null}
    </label>
  );
}
