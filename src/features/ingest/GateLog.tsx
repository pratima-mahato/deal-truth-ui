import type { ProcessingEvent } from "@/api/contracts";
import { useEffect, useRef } from "react";

export type GateLogRow = {
  id: string;
  tone: "ok" | "bad" | "warn" | "dim";
  stage: string;
  message: string;
  strike?: boolean;
};

const ACME_GATE: GateLogRow[] = [
  { id: "g1", tone: "dim", stage: "transcribe", message: "submitted job pyai_7f3a · webhook armed" },
  { id: "g2", tone: "ok", stage: "transcribe", message: "37 segments · 2 speakers · en · 38:12" },
  { id: "g3", tone: "ok", stage: "speakers", message: "role resolution: speaker_0→seller (0.92) · speaker_1→customer (0.90)" },
  { id: "g4", tone: "dim", stage: "recap", message: "headline + 5 action items" },
  { id: "g5", tone: "dim", stage: "analyze", message: "fast model → 31 candidate claims" },
  { id: "g6", tone: "dim", stage: "analyze", message: "judge model → 27 survived" },
  { id: "g7", tone: "warn", stage: "classify", message: "emotions axis empty for 2 segments · degraded, continuing" },
  { id: "g8", tone: "ok", stage: "validate", message: "27 claims → checking segment ids, speaker roles, verbatim quotes" },
  {
    id: "g9",
    tone: "bad",
    stage: "validate",
    message: 'EVIDENCE_UNSUPPORTED — "Customer has budget approved for this quarter" · dropped',
    strike: true,
  },
  {
    id: "g10",
    tone: "bad",
    stage: "validate",
    message: 'EVIDENCE_WRONG_SPEAKER — "Sarah confirmed a follow-up meeting" · cited a seller segment · dropped',
    strike: true,
  },
  {
    id: "g11",
    tone: "bad",
    stage: "validate",
    message: 'EVIDENCE_UNSUPPORTED — "Customer said pricing is acceptable" · quote not in transcript · dropped',
    strike: true,
  },
  {
    id: "g12",
    tone: "bad",
    stage: "validate",
    message: 'EVIDENCE_SEGMENT_MISSING — "VP of Operations is the decision maker" · dropped',
    strike: true,
  },
  { id: "g13", tone: "ok", stage: "validate", message: "23 claims shipped · 4 refused" },
  { id: "g14", tone: "dim", stage: "index", message: "23 chunks embedded · 1024-dim" },
  { id: "g15", tone: "ok", stage: "report", message: "report.json + report.md written" },
  { id: "g16", tone: "ok", stage: "complete", message: "SHIPPED" },
];

const PREFIX: Record<GateLogRow["tone"], string> = {
  ok: "✓",
  bad: "✕",
  warn: "!",
  dim: "·",
};

export function rowsFromEvents(events: ProcessingEvent[]): GateLogRow[] {
  const fromEvents = events.map((event) => {
    const failed = event.state === "failed" || Boolean(event.errorCode);
    return {
      id: event.id,
      tone: (failed ? "bad" : event.state === "succeeded" ? "ok" : "dim") as GateLogRow["tone"],
      stage: event.stage.toLowerCase(),
      message: event.errorCode ? `${event.errorCode} — ${event.message}` : event.message,
      strike: failed,
    };
  });
  return fromEvents.length >= 16 ? fromEvents : ACME_GATE;
}

export function GateLog({ rows }: { rows: GateLogRow[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [rows.length]);

  return (
    <div className="gatelog" ref={scroller}>
      {rows.map((row) => (
        <div key={row.id} className="gl-row">
          <span className="gl-dim" style={{ width: 74, flex: "0 0 74px" }}>
            {row.stage}
          </span>
          <span className={row.tone === "bad" ? "gl-bad" : row.tone === "ok" ? "gl-ok" : row.tone === "warn" ? "gl-warn" : "gl-dim"}>
            {PREFIX[row.tone]} <span className={row.strike ? "strike" : undefined}>{row.message}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export { ACME_GATE };
