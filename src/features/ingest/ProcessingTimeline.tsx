import { Check, Circle, LoaderCircle } from "lucide-react";
import type { CallStatus } from "@/api/contracts";
import { cn } from "@/lib/utils";
import { LiveWaveform } from "@/components/audio/Waveform";

export const ANALYSIS_STEPS: {
  status: CallStatus;
  title: string;
  detail: string;
}[] = [
  { status: "UPLOADING", title: "File uploaded", detail: "Recording received and stored for analysis" },
  { status: "QUEUED", title: "Audio prepared", detail: "Normalizing the conversation for transcription" },
  { status: "TRANSCRIBING", title: "Transcribing conversation", detail: "Identifying speakers and timestamps" },
  { status: "WAITING_FOR_RECAP", title: "Detecting speakers", detail: "Separating seller and customer turns" },
  { status: "ANALYZING", title: "Understanding conversation", detail: "Extracting topics, intent, and commitments" },
  { status: "VALIDATING", title: "Extracting deal signals", detail: "Looking for buying signals, risks, and objections" },
  { status: "INDEXING", title: "Building intelligence", detail: "Linking every claim to transcript evidence" },
  { status: "BUILDING_REPORT", title: "Preparing overview", detail: "Assembling the call intelligence report" },
];

export function ProcessingTimeline({
  status,
  failed,
}: {
  status: CallStatus;
  failed?: boolean;
}) {
  const normalized = status === "CREATED" ? "UPLOADING" : status;
  const current = ANALYSIS_STEPS.findIndex((s) => s.status === normalized);
  const complete = status === "SHIPPED" || status === "PARTIAL";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <ol className="space-y-3">
        {ANALYSIS_STEPS.map((step, index) => {
          const done = complete || current > index;
          const active = !complete && index === current;
          return (
            <li
              key={step.status}
              className={cn(
                "flex gap-3 rounded-xl border px-4 py-3 transition",
                active ? "border-violet-200 bg-violet-50 shadow-card" : "border-transparent bg-transparent",
              )}
            >
              <span className="mt-0.5">
                {failed && active ? (
                  <Circle className="h-5 w-5 text-red-600" />
                ) : done ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : active ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-violet-600" />
                ) : (
                  <Circle className="h-5 w-5 text-ink-200" />
                )}
              </span>
              <span>
                <span className={cn("block text-sm font-semibold", active ? "text-ink-900" : "text-ink-700")}>
                  {step.title}
                </span>
                <span className="mt-0.5 block text-sm text-ink-500">{step.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-100 bg-violet-50/60 p-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">AI working</p>
        <div className="mt-6 w-full max-w-sm">
          <LiveWaveform active={!complete && !failed} />
        </div>
        <p className="mt-6 max-w-xs text-sm text-ink-600">
          {complete
            ? "Your conversation intelligence is ready."
            : "Listening for what was said, what matters, and what happens next."}
        </p>
      </div>
    </div>
  );
}
