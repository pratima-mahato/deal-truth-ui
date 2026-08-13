import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CallDropZone } from "@/features/ingest/CallDropZone";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/Badge";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { RecommendationsPanel } from "@/features/recommendations/RecommendationsPanel";
import { useCalls, useRecommendations, useSampleCall, useUploadFlow } from "@/hooks/useCallApi";
import { formatDate, formatDuration } from "@/lib/utils";
import { env } from "@/config/env";
import { isReportReadyStatus } from "@/api/contracts";

export function DashboardPage() {
  const calls = useCalls();
  const recs = useRecommendations();
  const sample = useSampleCall();
  const upload = useUploadFlow();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  if (calls.isLoading) return <PageSkeleton />;
  if (calls.isError) {
    return (
      <ErrorState
        title="Could not load calls"
        description="The Deal Truth API did not return the call list. Check VITE_API_BASE_URL and that the API is reachable."
        onRetry={() => void calls.refetch()}
      />
    );
  }

  const items = calls.data?.items ?? [];
  const showRep = items.some((call) => Boolean(call.repName));
  const showSignals = items.some((call) => Boolean(call.biggestRisk || call.signalBadges?.length));

  function analyze() {
    if (!file) return;
    const title = file.name.replace(/\.[^.]+$/, "");
    upload.mutate(
      {
        title,
        customerName: "New contact",
        repName: "You",
        callDirection: "outbound",
        sourceType: "upload",
        file,
      },
      {
        onSuccess: (call) => navigate(`/calls/${call.id}/processing`),
      },
    );
  }

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700">OpenGong</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 text-balance sm:text-4xl">
          Turn conversations into deal intelligence.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-500">
          Upload a call recording and let OpenGong uncover what was said, what matters, and what happens next.
        </p>
      </section>

      <CallDropZone
        file={file}
        onFile={setFile}
        onAnalyze={analyze}
        pending={upload.isPending}
        error={upload.isError ? (upload.error instanceof Error ? upload.error.message : "Upload failed") : null}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-900">Recent conversations</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/upload">
            <Button variant="secondary" size="sm">
              Upload details
            </Button>
          </Link>
          {env.useMocks ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                sample.mutate(undefined, {
                  onSuccess: (call) => navigate(`/calls/${call.id}/processing`),
                })
              }
            >
              Load sample call
            </Button>
          ) : null}
        </div>
      </div>

      {recs.data?.available === false ? null : recs.data?.items ? (
        <RecommendationsPanel items={recs.data.items} />
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No calls yet"
          description={
            env.useMocks
              ? "Drop a recording above or load the sample conversation to see evidence-backed intelligence."
              : "Drop a recording above. Analysis runs on the live Prompt 2 API."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-surface">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Call</th>
                {showRep ? <th className="hidden px-4 py-3 font-medium sm:table-cell">Rep</th> : null}
                <th className="hidden px-4 py-3 font-medium md:table-cell">Duration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {showSignals ? <th className="hidden px-4 py-3 font-medium lg:table-cell">Signals</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((call) => {
                const href = isReportReadyStatus(call.status)
                  ? `/calls/${call.id}/overview`
                  : `/calls/${call.id}/processing`;
                return (
                  <tr key={call.id} className="border-t border-ink-100/80 hover:bg-violet-50/50">
                    <td className="px-4 py-3">
                      <Link to={href} className="font-medium text-ink-900 hover:text-violet-700">
                        {call.customerName || call.title || call.id}
                      </Link>
                      <p className="text-xs text-ink-500">
                        {call.title} · {formatDate(call.createdAt)}
                      </p>
                    </td>
                    {showRep ? (
                      <td className="hidden px-4 py-3 text-ink-600 sm:table-cell">{call.repName || "—"}</td>
                    ) : null}
                    <td className="hidden px-4 py-3 text-ink-600 md:table-cell">{formatDuration(call.durationMs)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={call.status} />
                    </td>
                    {showSignals ? (
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <p className="text-xs text-ink-600">
                          {call.biggestRisk || call.signalBadges?.join(" · ") || "—"}
                        </p>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
