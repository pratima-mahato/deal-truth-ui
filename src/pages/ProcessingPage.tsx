import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ErrorState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ProcessingTimeline } from "@/features/ingest/ProcessingTimeline";
import { useCall, useReanalyze, useCancel } from "@/hooks/useCallApi";
import { processCall, subscribeProcessing, type ProcessingSnapshot } from "@/api";
import { isTerminalStatus } from "@/api/contracts";
import { useQueryClient } from "@tanstack/react-query";

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
          window.setTimeout(() => navigate(`/calls/${callId}/overview`, { replace: true }), 1200);
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

  const kicked = useRef(false);
  const current = call.data;

  useEffect(() => {
    if (!current) return;
    if (current.status === "SHIPPED" || current.status === "PARTIAL") {
      setSuccess(true);
      const t = window.setTimeout(() => navigate(`/calls/${callId}/overview`, { replace: true }), 1200);
      return () => window.clearTimeout(t);
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
  const stalled =
    !isTerminalStatus(status) &&
    Boolean(lastAt) &&
    now - new Date(lastAt).getTime() > STALL_MS;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Call analysis</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
        {current.title || current.customerName || "Call analysis"}
      </h1>
      <p className="mt-2 text-sm text-ink-500">Analyzing your conversation — every claim will be tied to evidence.</p>

      <div className="mt-8">
        {current.status === "FAILED" || status === "FAILED" ? (
          <Alert
            tone="danger"
            title={current.failureKind === "TRANSCRIPTION" ? "Transcription failed" : "Processing failed"}
          >
            <p>{current.failureMessage ?? lastEvent?.message ?? "The job did not complete."}</p>
            <p className="mt-2 text-xs">
              {current.failureKind === "INFRASTRUCTURE" || current.failureKind === "TRANSCRIPTION"
                ? "This is an infrastructure failure, not a judgment about the deal."
                : null}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => retry.mutate()} disabled={retry.isPending}>
                Retry
              </Button>
              <Link to="/">
                <Button variant="secondary">Back to workspace</Button>
              </Link>
            </div>
          </Alert>
        ) : current.status === "CANCELLED" || status === "CANCELLED" ? (
          <Alert tone="warning" title="Processing cancelled">
            <p>This job was cancelled. You can start a new analysis from the workspace.</p>
            <div className="mt-4">
              <Link to="/">
                <Button variant="secondary">Back to workspace</Button>
              </Link>
            </div>
          </Alert>
        ) : success ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-emerald-900">Analysis complete</p>
            <p className="mt-2 text-sm text-emerald-800">Your conversation intelligence is ready.</p>
          </div>
        ) : (
          <div>
            {pollError ? (
              <div className="mb-4">
                <Alert tone="danger" title="Could not refresh status">
                  {pollError}
                </Alert>
              </div>
            ) : null}
            {stalled ? (
              <div className="mb-4">
                <Alert tone="warning" title="Transcription is taking longer than usual">
                  <p>
                    The API is still on this step{elapsed ? ` (${elapsed})` : ""}. Upload succeeded; the transcription
                    worker has not finished. This is a backend delay, not a missing file.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => retry.mutate()} disabled={retry.isPending}>
                      {retry.isPending ? "Retrying…" : "Retry analysis"}
                    </Button>
                    <Button variant="secondary" onClick={() => void call.refetch()}>
                      Refresh status
                    </Button>
                  </div>
                  {retry.isError ? (
                    <p className="mt-2 text-sm text-red-700">
                      {retry.error instanceof Error ? retry.error.message : "Retry failed."}
                    </p>
                  ) : null}
                </Alert>
              </div>
            ) : (
              <p className="mb-4 text-sm text-ink-500">
                {status === "TRANSCRIBING"
                  ? `Transcribing on the API${elapsed ? ` · running ${elapsed}` : ""}. Longer recordings can take a few minutes.`
                  : `Waiting for the next processing stage${elapsed ? ` · last update ${elapsed} ago` : ""}.`}
              </p>
            )}
            <ProcessingTimeline status={status} />
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
                Cancel processing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
