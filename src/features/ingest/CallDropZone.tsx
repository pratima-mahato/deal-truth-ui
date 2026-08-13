import { useState, type DragEvent } from "react";
import { FileAudio } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/utils";
import { LiveWaveform } from "@/components/audio/Waveform";
import { cn } from "@/lib/utils";

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

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer.files[0] ?? null);
  }

  if (file) {
    return (
          <div className="rounded-2xl border border-violet-100 bg-surface p-5 shadow-card sm:p-8">
        <div className="flex flex-col items-center text-center">
          <LiveWaveform active={false} />
          <p className="mt-4 text-lg font-semibold text-ink-900">{file.name}</p>
          <p className="mt-1 text-sm text-ink-500">{formatBytes(file.size)}</p>
          <p className="mt-3 text-sm font-medium text-emerald-700">Ready for analysis</p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => onFile(null)}>
              Choose another
            </Button>
            <Button onClick={onAnalyze} disabled={pending}>
              {pending ? "Uploading…" : "Analyze Call"}
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center rounded-2xl border border-dashed bg-surface px-4 py-10 text-center transition sm:px-8 sm:py-16",
        over ? "border-violet-500 bg-violet-50 shadow-lift" : "border-violet-200 hover:border-violet-400 hover:shadow-card",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        className="sr-only"
        accept=".mp3,.wav,.m4a,.mp4,.webm,.ogg,audio/*,video/mp4"
        onChange={(e) => take(e.target.files?.[0] ?? null)}
      />
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <FileAudio className="h-7 w-7" />
      </span>
      <LiveWaveform active={over} />
      <p className="mt-4 text-lg font-semibold text-ink-900">Drop your call recording here</p>
      <p className="mt-1 text-sm text-ink-500">or browse files</p>
      <p className="mt-4 text-xs font-medium tracking-wide text-ink-400">MP3 · WAV · M4A · MP4</p>
    </label>
  );
}
