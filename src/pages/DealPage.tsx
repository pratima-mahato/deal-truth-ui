import { Link } from "react-router-dom";
import { DEAL_DIMENSIONS } from "@/lib/evidence";
import { env } from "@/config/env";

type Cell = "proven" | "blocked" | "missing";

const CALLS: { id: string; title: string; when: string; dur: string; states: Record<string, Cell>; current?: boolean }[] = [
  {
    id: "intro",
    title: "Intro call",
    when: "28 Jul",
    dur: "22:14",
    states: {
      pain_identified: "proven",
      business_impact_identified: "missing",
      decision_maker_identified: "missing",
      economic_buyer_identified: "missing",
      timeline_identified: "missing",
      next_meeting_committed: "proven",
      competitor_active: "missing",
      blocker_active: "missing",
    },
  },
  {
    id: "deep-dive",
    title: "Product deep-dive",
    when: "5 Aug",
    dur: "41:02",
    states: {
      pain_identified: "proven",
      business_impact_identified: "proven",
      decision_maker_identified: "proven",
      economic_buyer_identified: "missing",
      timeline_identified: "proven",
      next_meeting_committed: "proven",
      competitor_active: "blocked",
      blocker_active: "missing",
    },
  },
  {
    id: "latest",
    title: "Enterprise discovery",
    when: "13 Aug",
    dur: "38:12",
    current: true,
    states: {
      pain_identified: "proven",
      business_impact_identified: "proven",
      decision_maker_identified: "missing",
      economic_buyer_identified: "missing",
      timeline_identified: "missing",
      next_meeting_committed: "blocked",
      competitor_active: "blocked",
      blocker_active: "blocked",
    },
  },
];

function count(states: Record<string, Cell>, kind: Cell) {
  return Object.values(states).filter((v) => v === kind).length;
}

export function DealPage() {
  const W = 680;
  const H = 150;
  const PAD = 34;
  const C = CALLS.map((c) => ({ proven: count(c.states, "proven"), blocked: count(c.states, "blocked") }));
  const X = (i: number) => PAD + i * ((W - PAD * 2) / (CALLS.length - 1));
  const Y = (v: number) => H - 24 - (v / 8) * (H - 52);
  const poly = (pick: (c: (typeof C)[0]) => number) =>
    C.map((c, i) => `${X(i).toFixed(1)},${Y(pick(c)).toFixed(1)}`).join(" ");

  return (
    <div className="page mid">
      <div className="vstack" style={{ gap: 16 }}>
        <div className="card pad-lg reveal">
          <div className="between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 5 }}>
                Deal · 3 calls · 18 days
              </div>
              <h1 className="serif" style={{ fontSize: 31, letterSpacing: "-.02em" }}>
                Acme Inc.
              </h1>
              <div className="sub" style={{ marginTop: 3 }}>
                Sarah Mitchell · rep Rahul Mehta
              </div>
            </div>
            <Link to={`/calls/${env.demoCallId}/verdict`} className="btn primary">
              Open the latest call
            </Link>
          </div>
          <div className="hstack" style={{ flexWrap: "wrap", marginTop: 12 }}>
            {DEAL_DIMENSIONS.map((dim) => (
              <span key={dim.id} className="chip">
                {dim.label}
              </span>
            ))}
          </div>
          <div className="serif" style={{ fontSize: 23, lineHeight: 1.28, letterSpacing: "-.012em", maxWidth: "40ch", marginTop: 10 }}>
            This deal peaked eight days ago.{" "}
            <span style={{ color: "var(--blocker)" }}>
              It has since lost its timeline and its next meeting, and gained a security blocker.
            </span>
          </div>
          <p className="invariant" style={{ marginTop: 12 }}>
            No health score. Every point on this chart is a dimension somebody either stated or didn't.
          </p>
        </div>

        <div className="card pad-lg reveal">
          <div className="between" style={{ marginBottom: 6 }}>
            <span className="h-sec">Dimensions proven, per call</span>
            <span className="tiny">counted, not modelled — click any call to open it</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
            {[0, 2, 4, 6, 8].map((v) => (
              <g key={v}>
                <line x1={PAD} y1={Y(v)} x2={W - PAD} y2={Y(v)} stroke="var(--line)" strokeWidth="1" />
                <text x={PAD - 10} y={Y(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="monospace">
                  {v}
                </text>
              </g>
            ))}
            <polyline fill="none" stroke="var(--proof)" strokeWidth="2.6" strokeLinecap="round" points={poly((c) => c.proven)} />
            <polyline fill="none" stroke="var(--blocker)" strokeWidth="2.6" strokeLinecap="round" points={poly((c) => c.blocked)} />
            {C.map((c, i) => (
              <g key={i}>
                <circle cx={X(i)} cy={Y(c.proven)} r="5" fill="var(--proof)" />
                <text x={X(i)} y={Y(c.proven) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--proof)">
                  {c.proven}
                </text>
                <circle cx={X(i)} cy={Y(c.blocked)} r="5" fill="var(--blocker)" />
                <text x={X(i)} y={Y(c.blocked) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--blocker)">
                  {c.blocked}
                </text>
                <text x={X(i)} y={H - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-2)">
                  {CALLS[i].when}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="card pad-lg reveal">
          <div className="between" style={{ marginBottom: 12 }}>
            <span className="h-sec">What changed, and when</span>
            <span className="tiny">saffron ring = flipped since the previous call</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="matrix">
              <colgroup>
                <col />
                <col />
                <col />
                <col className="now" />
              </colgroup>
              <thead>
                <tr>
                  <th>Dimension</th>
                  {CALLS.map((c) => (
                    <th key={c.title}>
                      {c.title}
                      <br />
                      <span style={{ fontWeight: 600, letterSpacing: 0, textTransform: "none" }}>
                        {c.when} · {c.dur}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEAL_DIMENSIONS.map((dim) => (
                  <tr key={dim.id}>
                    <td className="dimname">{dim.label}</td>
                    {CALLS.map((call, ci) => {
                      const state = call.states[dim.id];
                      const flip = ci > 0 && CALLS[ci].states[dim.id] !== CALLS[ci - 1].states[dim.id];
                      return (
                        <td key={call.title}>
                          <span className={`cell ${state}${flip ? " flip" : ""}`}>
                            {state === "proven" ? "proven" : state === "blocked" ? "blocked" : "not found"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card pad-lg reveal">
          <div className="h-sec" style={{ marginBottom: 10 }}>
            Four things moved backwards since 5 August
          </div>
          <div className="vstack" style={{ gap: 10 }}>
            {[
              { title: "Next meeting committed", was: "proven", now: "blocked", note: "The customer declined to book a date for the first time in three calls.", play: true },
              { title: "Blocker active", was: "not found", now: "blocked", note: "A mandatory vendor security review appeared for the first time.", play: true },
              { title: "Purchase timeline", was: "proven", now: "not found", note: "Nothing was said on this call — there is no clip to play. That is the finding.", play: false },
              { title: "Decision maker identified", was: "proven", now: "not found", note: "Named on 5 Aug, then neither present nor referenced on this call.", play: false },
            ].map((item) => (
              <div key={item.title} className="receipt absent">
                <div className="receipt-head">
                  <span className={`chip ${item.now === "blocked" ? "blocker" : "absent"}`}>{item.now}</span>
                  <span className="chip">{item.was} → {item.now}</span>
                </div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{item.title}</div>
                <div className="sub" style={{ fontSize: 12.5 }}>{item.note}</div>
                {item.play ? (
                  <div className="receipt-meta">
                    <Link to={`/calls/${env.demoCallId}/verdict`} className="btn sm play">
                      Hear it on the latest call
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="card pad-lg reveal">
          <div className="h-sec" style={{ marginBottom: 10 }}>
            Calls in this deal
          </div>
          {CALLS.map((call) => (
            <div key={call.title} className="between" style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{call.title}</div>
                <div className="tiny">
                  {call.when} · {call.dur}
                </div>
              </div>
              <div className="hstack">
                <span className="tiny">
                  <span className="chip proof">{count(call.states, "proven")} proven</span>{" "}
                  <span className="chip blocker">{count(call.states, "blocked")} blocked</span>{" "}
                  <span className="chip absent">{count(call.states, "missing")} not found</span>
                </span>
                {call.current ? (
                  <Link to={`/calls/${env.demoCallId}/verdict`} className="btn sm">
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
