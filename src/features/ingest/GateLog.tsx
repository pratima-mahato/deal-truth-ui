import type { ProcessingEvent } from "@/api/contracts";
import { useEffect, useRef } from "react";

export type GateLogRow = {
  id: string;
  tone: "ok" | "bad" | "warn" | "dim";
  stage: string;
  message: string;
  strike?: boolean;
};

const PREFIX: Record<GateLogRow["tone"], string> = {
  ok: "✓",
  bad: "✕",
  warn: "!",
  dim: "·",
};

export function rowsFromEvents(events: ProcessingEvent[]): GateLogRow[] {
  return events.map((event) => {
    const failed = event.state === "failed" || Boolean(event.errorCode);
    return {
      id: event.id,
      tone: (failed ? "bad" : event.state === "succeeded" ? "ok" : "dim") as GateLogRow["tone"],
      stage: event.stage.toLowerCase(),
      message: event.errorCode ? `${event.errorCode} — ${event.message}` : event.message,
      strike: failed,
    };
  });
}

export function GateLog({ rows }: { rows: GateLogRow[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [rows.length]);

  if (!rows.length) {
    return <div className="tiny">Waiting for processing events…</div>;
  }

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
