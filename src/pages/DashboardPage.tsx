import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CallDropZone } from "@/features/ingest/CallDropZone";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/Badge";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ProofPips, callPips } from "@/features/calls/DealSignalStrip";
import { GATE_CLAIMS_REFUSED, GATE_CLAIMS_SHIPPED } from "@/lib/evidence";
import { useCalls, useRecommendations, useSampleCall, useUploadFlow } from "@/hooks/useCallApi";
import { formatDate, formatDuration } from "@/lib/utils";
import { env } from "@/config/env";
import { isReportReadyStatus } from "@/api/contracts";
import { ArrowGlyph } from "@/components/brand/ChakraMark";

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
      { onSuccess: (call) => navigate(`/calls/${call.id}/processing`) },
    );
  }

  return (
    <div className="page mid">
      <div className="between" style={{ marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Deal Truth · workspace
          </div>
          <h1 className="hero-title" style={{ maxWidth: "17ch" }}>
            The call intelligence tool that <span className="mark-saffron">shows its receipts</span>.
          </h1>
          <p className="invariant" style={{ marginTop: 9 }}>
            No proof in the transcript, no claim in the report.
          </p>
        </div>
        <div className="hstack">
          <Link to="/upload" className="btn">
            Upload a call
          </Link>
          {items[0] ? (
            <Link to={`/calls/${env.demoCallId}/verdict`} className="btn primary">
              Open the Acme call <ArrowGlyph />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="split3" style={{ marginBottom: 18 }}>
        {[
          { n: "①", t: "Every insight has proof", d: "Click any claim and hear the customer say it. Nothing ships without a segment behind it.", c: "proof", to: `/calls/${env.demoCallId}/verdict` },
          { n: "②", t: "Every risk has a reason", d: "No health score. Eight dimensions, each either stated, blocked, or never mentioned.", c: "blocker", to: "/deals/acme" },
          { n: "③", t: "Every call ends with an action", d: "A battlecard and a follow-up email built only from what was actually agreed.", c: "brand", to: `/calls/${env.demoCallId}/act` },
        ].map((card) => (
          <Link key={card.t} to={card.to} className="card lift pad reveal" style={{ textAlign: "left" }}>
            <div className="hstack" style={{ marginBottom: 7 }}>
              <span className="serif" style={{ fontSize: 24, color: `var(--${card.c})` }}>
                {card.n}
              </span>
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>{card.t}</span>
              <span className={`chip ${card.c === "proof" ? "proof" : card.c === "blocker" ? "blocker" : "brand"}`}>
                {card.c === "proof" ? "PROVEN" : card.c === "blocker" ? "NOT FOUND" : "receipt"}
              </span>
            </div>
            <div className="sub" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              {card.d}
            </div>
          </Link>
        ))}
      </div>

      <CallDropZone
        file={file}
        onFile={setFile}
        onAnalyze={analyze}
        pending={upload.isPending}
        error={upload.isError ? (upload.error instanceof Error ? upload.error.message : "Upload failed") : null}
      />

      <div className="between" style={{ margin: "18px 0 10px" }}>
        <span className="h-sec">Recent calls</span>
        <span className="tiny">
          Pips show the 8 deal dimensions · <span style={{ color: "var(--proof)" }}>proven</span> ·{" "}
          <span style={{ color: "var(--blocker)" }}>blocked</span> · <span style={{ color: "var(--text-3)" }}>not found</span>
        </span>
      </div>

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
        <div className="rows">
          <div className="row head">
            <div>Customer</div>
            <div>Rep</div>
            <div>Length</div>
            <div>What's in the way</div>
            <div>Proof</div>
          </div>
          {items.map((call) => {
            const href = isReportReadyStatus(call.status)
              ? `/calls/${call.id}/verdict`
              : `/calls/${call.id}/processing`;
            const failed = call.status === "FAILED";
            return (
              <div
                key={call.id}
                className="row"
                onClick={() => {
                  if (!failed) navigate(href);
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                    {call.customerName || call.title || call.id}{" "}
                    <span style={{ color: "var(--text-3)", fontWeight: 500 }}>· {call.title}</span>
                  </div>
                  <div className="tiny" style={{ marginTop: 2 }}>
                    {formatDate(call.createdAt)}
                  </div>
                </div>
                <div className="sub">{call.repName || "—"}</div>
                <div className="mono tiny">{formatDuration(call.durationMs)}</div>
                <div className="hstack">
                  <StatusPill status={call.status} />
                  <span className="tiny" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {failed ? call.failureMessage || call.biggestRisk || "Failed" : call.biggestRisk || "—"}
                  </span>
                </div>
                <ProofPips states={failed ? [] : callPips(call)} />
              </div>
            );
          })}
        </div>
      )}

      <div className="split" style={{ marginTop: 18 }}>
        <div className="card pad">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Across your calls this week
          </div>
          {(recs.data?.items ?? []).slice(0, 4).map((item) => (
            <Link key={item.id} to={`/search?q=${encodeURIComponent(item.query)}`} className="between" style={{ padding: "8px 0" }}>
              <span style={{ fontSize: 13 }}>{item.description || item.title}</span>
              <ArrowGlyph />
            </Link>
          ))}
        </div>
        <div className="card pad">
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            The gate, this week
          </div>
          <div className="split">
            <div>
              <div className="big-num" style={{ fontSize: 48, color: "var(--proof)" }}>
                {GATE_CLAIMS_SHIPPED}
              </div>
              <div className="tiny">claims shipped with proof</div>
              <span className="chip proof" style={{ marginTop: 8 }}>PROVEN</span>
            </div>
            <div>
              <div className="big-num" style={{ fontSize: 48, color: "var(--blocker)" }}>
                {GATE_CLAIMS_REFUSED}
              </div>
              <div className="tiny">claims refused</div>
              <span className="chip blocker" style={{ marginTop: 8 }}>NOT FOUND</span>
            </div>
          </div>
        </div>
      </div>

      {env.useMocks ? (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => sample.mutate(undefined, { onSuccess: (call) => navigate(`/calls/${call.id}/processing`) })}
          >
            Load sample call
          </button>
        </div>
      ) : null}
    </div>
  );
}
