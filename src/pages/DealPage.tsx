import { Link, useParams } from "react-router-dom";
import { DEAL_DIMENSIONS } from "@/lib/evidence";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useDeal } from "@/hooks/useCallApi";
import {
  accountLabel,
  cellLabel,
  contactLabel,
  countStates,
  dealFinding,
  formatDealDate,
  formatDealDuration,
  regressionsFor,
} from "@/features/deals/dealTimeline";

export function DealPage() {
  const { id = "" } = useParams();
  const dealQuery = useDeal(id);

  if (dealQuery.isLoading) return <PageSkeleton />;
  if (dealQuery.isError || !dealQuery.data) {
    return (
      <ErrorState
        title="Deal not found"
        description="This deal is not available from the API. Open it from a call that has a deal id."
        onRetry={() => void dealQuery.refetch()}
      />
    );
  }

  const deal = dealQuery.data;
  const calls = deal.calls;
  const regressions = regressionsFor(deal);
  const latest = calls.at(-1);
  const latestHref = latest ? `/calls/${latest.callId}/verdict` : "/";
  const W = 680;
  const H = 150;
  const PAD = 34;
  const counts = calls.map((call) => ({
    proven: countStates(call.states, "proven"),
    blocked: countStates(call.states, "blocked"),
  }));
  const X = (index: number) =>
    calls.length <= 1 ? W / 2 : PAD + index * ((W - PAD * 2) / Math.max(calls.length - 1, 1));
  const Y = (value: number) => H - 24 - (value / 8) * (H - 52);
  const poly = (pick: (row: (typeof counts)[number]) => number) =>
    counts.map((row, index) => `${X(index).toFixed(1)},${Y(pick(row)).toFixed(1)}`).join(" ");
  const contact = contactLabel(deal);
  const account = accountLabel(deal);
  const since = calls.length >= 2 ? formatDealDate(calls[calls.length - 2].createdAt) : "";

  return (
    <div className="page mid">
      <div className="vstack" style={{ gap: 16 }}>
        <div className="card pad-lg reveal">
          <div className="between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 5 }}>
                Deal · {deal.callCount} call{deal.callCount === 1 ? "" : "s"}
                {deal.spanDays ? ` · ${deal.spanDays} day${deal.spanDays === 1 ? "" : "s"}` : ""}
              </div>
              <h1 className="serif" style={{ fontSize: 31, letterSpacing: "-.02em" }}>
                {account}
              </h1>
              <div className="sub" style={{ marginTop: 3 }}>
                {[contact, deal.repName ? `rep ${deal.repName}` : ""].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            {latest ? (
              <Link to={latestHref} className="btn primary">
                Open the latest call
              </Link>
            ) : null}
          </div>
          <div className="hstack" style={{ flexWrap: "wrap", marginTop: 12 }}>
            {DEAL_DIMENSIONS.map((dim) => (
              <span key={dim.id} className="chip">
                {dim.label}
              </span>
            ))}
          </div>
          <div className="serif" style={{ fontSize: 23, lineHeight: 1.28, letterSpacing: "-.012em", maxWidth: "40ch", marginTop: 10 }}>
            {dealFinding(deal)}
          </div>
          <p className="invariant" style={{ marginTop: 12 }}>
            No health score. Every point on this chart is a dimension somebody either stated or didn't.
          </p>
        </div>

        {calls.length === 0 ? (
          <EmptyState title="No calls in this deal" description="Calls that share this deal id will appear here after they ship." />
        ) : (
          <div className="card pad-lg reveal">
            <div className="between" style={{ marginBottom: 6 }}>
              <span className="h-sec">Dimensions proven, per call</span>
              <span className="tiny">counted, not modelled — click any call to open it</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
              {[0, 2, 4, 6, 8].map((value) => (
                <g key={value}>
                  <line x1={PAD} y1={Y(value)} x2={W - PAD} y2={Y(value)} stroke="var(--line)" strokeWidth="1" />
                  <text x={PAD - 10} y={Y(value) + 4} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="monospace">
                    {value}
                  </text>
                </g>
              ))}
              {counts.length ? (
                <>
                  <polyline fill="none" stroke="var(--proof)" strokeWidth="2.6" strokeLinecap="round" points={poly((row) => row.proven)} />
                  <polyline fill="none" stroke="var(--blocker)" strokeWidth="2.6" strokeLinecap="round" points={poly((row) => row.blocked)} />
                </>
              ) : null}
              {counts.map((row, index) => (
                <g key={calls[index].callId}>
                  <circle cx={X(index)} cy={Y(row.proven)} r="5" fill="var(--proof)" />
                  <text x={X(index)} y={Y(row.proven) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--proof)">
                    {row.proven}
                  </text>
                  <circle cx={X(index)} cy={Y(row.blocked)} r="5" fill="var(--blocker)" />
                  <text x={X(index)} y={Y(row.blocked) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--blocker)">
                    {row.blocked}
                  </text>
                  <text x={X(index)} y={H - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-2)">
                    {formatDealDate(calls[index].createdAt)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {calls.length ? (
          <div className="card pad-lg reveal">
            <div className="between" style={{ marginBottom: 12 }}>
              <span className="h-sec">What changed, and when</span>
              <span className="tiny">saffron ring = flipped since the previous call</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="matrix">
                <colgroup>
                  <col />
                  {calls.map((call, index) => (
                    <col key={call.callId} className={index === calls.length - 1 ? "now" : undefined} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th>Dimension</th>
                    {calls.map((call) => (
                      <th key={call.callId}>
                        {call.title}
                        <br />
                        <span style={{ fontWeight: 600, letterSpacing: 0, textTransform: "none" }}>
                          {formatDealDate(call.createdAt)} · {formatDealDuration(call.durationMs)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEAL_DIMENSIONS.map((dim) => (
                    <tr key={dim.id}>
                      <td className="dimname">{dim.label}</td>
                      {calls.map((call, index) => {
                        const state = call.states[dim.id] ?? "missing";
                        const flip = index > 0 && calls[index].states[dim.id] !== calls[index - 1].states[dim.id];
                        return (
                          <td key={call.callId}>
                            <span className={`cell ${state}${flip ? " flip" : ""}`}>{cellLabel(state)}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="card pad-lg reveal">
          <div className="h-sec" style={{ marginBottom: 10 }}>
            {regressions.length
              ? `${regressions.length} thing${regressions.length === 1 ? "" : "s"} moved backwards${since ? ` since ${since}` : ""}`
              : "Nothing moved backwards"}
          </div>
          {regressions.length === 0 ? (
            <div className="sub">No dimension worsened between the latest calls.</div>
          ) : (
            <div className="vstack" style={{ gap: 10 }}>
              {regressions.map((item) => (
                <div key={item.id} className="receipt absent">
                  <div className="receipt-head">
                    <span className={`chip ${item.now === "blocked" ? "blocker" : "absent"}`}>{cellLabel(item.now)}</span>
                    <span className="chip">
                      {cellLabel(item.was)} → {cellLabel(item.now)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{item.title}</div>
                  <div className="sub" style={{ fontSize: 12.5 }}>{item.note}</div>
                  {item.playable && item.callId ? (
                    <div className="receipt-meta">
                      <Link to={`/calls/${item.callId}/verdict`} className="btn sm play">
                        Hear it on the latest call
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card pad-lg reveal">
          <div className="h-sec" style={{ marginBottom: 10 }}>
            Calls in this deal
          </div>
          {calls.length === 0 ? (
            <div className="sub">No calls yet.</div>
          ) : (
            calls.map((call) => (
              <div key={call.callId} className="between" style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{call.title}</div>
                  <div className="tiny">
                    {formatDealDate(call.createdAt)} · {formatDealDuration(call.durationMs)}
                  </div>
                </div>
                <div className="hstack">
                  <span className="tiny">
                    <span className="chip proof">{countStates(call.states, "proven")} proven</span>{" "}
                    <span className="chip blocker">{countStates(call.states, "blocked")} blocked</span>{" "}
                    <span className="chip absent">{countStates(call.states, "missing")} not found</span>
                  </span>
                  {call.callId === latest?.callId ? (
                    <Link to={`/calls/${call.callId}/verdict`} className="btn sm">
                      Open
                    </Link>
                  ) : (
                    <Link to={`/calls/${call.callId}/verdict`} className="btn sm ghost">
                      Open
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
