import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ProcessingTimeline } from "@/features/ingest/ProcessingTimeline";
import { rowsFromEvents } from "@/features/ingest/GateLog";
import { useCall, useReanalyze, useCancel } from "@/hooks/useCallApi";
import { processCall, subscribeProcessing, type ProcessingSnapshot } from "@/api";
import { isTerminalStatus } from "@/api/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowGlyph } from "@/components/brand/ChakraMark";

const STALL_MS = 120_000;

function formatElapsed(fromIso: string | undefined, now: number): string {
  if (!fromIso) return "";
  const started = new Date(fromIso).getTime();
  if (!Number.isFinite(started)) return "";
  const seconds = Math.max(0, Math.floor((now - started) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

export function ProcessingPage() {
  const { callId = "" } = useParams();
  const call = useCall(callId);
  const retry = useReanalyze(callId);
  const cancel = useCancel(callId);
  const navigate = useNavigate();
  const client = useQueryClient();
  const kicked = useRef(false);
  const arrivedTerminal = useRef<boolean | null>(null);
  const [success, setSuccess] = useState(false);
  const [snapshot, setSnapshot] = useState<ProcessingSnapshot | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!callId) return;
    return subscribeProcessing(
      callId,
      (next) => {
        setSnapshot(next);
        setPollError(null);
        void client.invalidateQueries({ queryKey: ["call", callId] });
        if (next.status === "SHIPPED" || next.status === "PARTIAL") {
          setSuccess(true);
          if (arrivedTerminal.current === false) {
            window.setTimeout(() => navigate(`/calls/${callId}/verdict`, { replace: true }), 1200);
          }
        }
      },
      (error) => {
        setPollError(error instanceof Error ? error.message : "Could not refresh processing status.");
      },
    );
  }, [callId, client, navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const current = call.data;

  useEffect(() => {
    if (!current || arrivedTerminal.current !== null) return;
    arrivedTerminal.current = isTerminalStatus(current.status);
    if (arrivedTerminal.current) setSuccess(true);
  }, [current]);

  useEffect(() => {
    if (!current) return;
    if (isTerminalStatus(current.status)) {
      setSuccess(true);
      return;
    }
    if (!kicked.current && (current.status === "CREATED" || current.status === "UPLOADING")) {
      kicked.current = true;
      void processCall(callId);
    }
  }, [current, callId, navigate]);

  if (call.isLoading) return <PageSkeleton />;
  if (call.isError || !current) {
    return (
      <ErrorState
        title="Call not found"
        description="This processing job does not exist in the API."
        onRetry={() => void call.refetch()}
      />
    );
  }

  const status = current.status;
  const lastEvent = snapshot?.events.at(-1);
  const lastAt = lastEvent?.createdAt || current.updatedAt;
  const elapsed = formatElapsed(lastAt, now);
  const stalled = !isTerminalStatus(status) && Boolean(lastAt) && now - new Date(lastAt).getTime() > STALL_MS;
  const logRows = rowsFromEvents(snapshot?.events ?? []);

  return (
    <div className="page narrow">
      <div className="between" style={{ marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 5 }}>
            Processing
          </div>
          <h1 className="serif" style={{ fontSize: 29, letterSpacing: "-.02em" }}>
            {current.customerName || current.title}
          </h1>
        </div>
        <span className="chip brand">{status}</span>
      </div>
      {pollError ? <p className="tiny" style={{ color: "var(--blocker)", marginBottom: 10 }}>{pollError}</p> : null}
      {stalled ? (
        <div className="card pad" style={{ marginBottom: 14, borderColor: "var(--unproven-line)" }}>
          Transcription is taking longer than usual{elapsed ? ` (${elapsed})` : ""}. The 1.5s poll is still running.
          <div className="hstack" style={{ marginTop: 10 }}>
            <button type="button" className="btn sm" onClick={() => retry.mutate()}>
              Retry analysis
            </button>
          </div>
        </div>
      ) : null}
      {current.status === "FAILED" ? (
        <div className="card pad" style={{ borderColor: "var(--blocker-line)", marginBottom: 14 }}>
          <div className="h-sec" style={{ color: "var(--blocker)" }}>Processing failed</div>
          <p className="sub">{current.failureMessage}</p>
          <button type="button" className="btn primary" style={{ marginTop: 10 }} onClick={() => retry.mutate()}>
            Retry
          </button>
        </div>
      ) : (
        <ProcessingTimeline status={status} failed={status === "FAILED"} logRows={logRows} />
      )}
      <div className="between" style={{ marginTop: 12 }}>
        <button type="button" className="btn sm" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
          Cancel processing
        </button>
        {success ? (
          <Link to={`/calls/${callId}/verdict`} className="btn primary">
            Open the report <ArrowGlyph />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
