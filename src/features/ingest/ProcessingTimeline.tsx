import type { CallStatus } from "@/api/contracts";
import { cn } from "@/lib/utils";
import { GateLog, rowsFromEvents, type GateLogRow } from "./GateLog";

export const ANALYSIS_STEPS: {
  status: CallStatus;
  title: string;
  detail: string;
}[] = [
  { status: "QUEUED", title: "Queued", detail: "job accepted, budget reserved" },
  { status: "TRANSCRIBING", title: "Transcribing", detail: "PyAI Hear · diarisation + timestamps" },
  { status: "WAITING_FOR_RECAP", title: "Recap", detail: "PyAI Recap · baseline summary" },
  { status: "ANALYZING", title: "Analysing", detail: "candidates → judge → 8 extractors" },
  { status: "VALIDATING", title: "Validating evidence", detail: "every claim checked against the transcript" },
  { status: "INDEXING", title: "Indexing", detail: "embeddings → pgvector" },
  { status: "BUILDING_REPORT", title: "Building report", detail: "artifacts written to blob" },
  { status: "SHIPPED", title: "Shipped", detail: "terminal outcome recorded" },
];

export function ProcessingTimeline({
  status,
  failed,
  logRows,
}: {
  status: CallStatus;
  failed?: boolean;
  logRows?: GateLogRow[];
}) {
  const normalized = status === "CREATED" || status === "UPLOADING" ? "QUEUED" : status;
  const current = ANALYSIS_STEPS.findIndex((s) => s.status === normalized);
  const complete = status === "SHIPPED" || status === "PARTIAL";
  const rows = logRows ?? rowsFromEvents([]);

  return (
    <div className="split">
      <div className="card pad-lg">
        <div>
          {ANALYSIS_STEPS.map((step, index) => {
            const done = complete || current > index;
            const active = !complete && index === current;
            return (
              <div
                key={step.status}
                className={cn("stage", active && "active", done && "done")}
                data-st={index}
              >
                <div className="stage-i">{done ? "✓" : index + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{step.title}</div>
                  <div className="tiny">{step.detail}</div>
                </div>
                <div className="mono tiny">
                  {active && !failed ? <span className="chip brand">live</span> : done ? <span className="chip proof">done</span> : <span className="chip">queued</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card pad-lg" id="gatelog">
        <div className="between" style={{ marginBottom: 10 }}>
          <span className="h-sec">Gate log</span>
          <span className="tiny">every claim is checked before it ships</span>
        </div>
        <GateLog rows={rows} />
        <div className="tiny" style={{ marginTop: 12 }}>
          Refused claims are kept with their reason — never silently dropped.
        </div>
      </div>
    </div>
  );
}
