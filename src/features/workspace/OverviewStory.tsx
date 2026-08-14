import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { formatClock } from "@/lib/utils";
import type { ClickableInsight, OverviewModel } from "./overviewModel";

function SignalRow({ item }: { item: ClickableInsight }) {
  const { setFocus } = useEvidenceFocus();
  return (
    <button
      type="button"
      className="between"
      style={{ width: "100%", textAlign: "left", padding: "8px 0" }}
      onClick={() =>
        setFocus({
          insightId: item.id,
          segmentIds: item.evidence.segmentIds,
          play: false,
          drawer: {
            id: item.id,
            title: item.title,
            kind: item.kind,
            severity: item.severity,
            why: item.why,
            quote: item.quote,
            speakerName: item.speakerName,
            startMs: item.startMs,
            action: item.action,
            evidenceStatus: item.evidenceStatus,
          },
        })
      }
    >
      <span style={{ fontSize: 14, lineHeight: 1.45 }}>“{item.quote ?? item.title}”</span>
      <span className="mono tiny">{item.startMs != null ? formatClock(item.startMs) : ""}</span>
    </button>
  );
}

export function OverviewStory({ model }: { model: OverviewModel }) {
  return (
    <div className="vstack" style={{ gap: 16 }}>
      <div className="card pad-lg">
        <p className="eyebrow" style={{ marginBottom: 8 }}>The verdict</p>
        <p className="serif" style={{ fontSize: 24, lineHeight: 1.25, maxWidth: "34ch" }}>
          {model.narrative}
        </p>
        <p className="invariant" style={{ marginTop: 12 }}>
          No close score — only what was observed.
        </p>
      </div>
      <div className="card pad">
        <h2 className="eyebrow" style={{ color: "var(--proof)" }}>Buying signals</h2>
        {model.buyingSignals.map((item) => (
          <SignalRow key={item.id} item={item} />
        ))}
      </div>
      <div className="card pad">
        <h2 className="eyebrow" style={{ color: "var(--unproven)" }}>Attention required</h2>
        {model.attention.map((item) => (
          <article key={item.id} className="card pad" style={{ boxShadow: "none", marginTop: 10 }}>
            <p style={{ fontWeight: 800 }}>{item.title}</p>
            {item.quote ? <p className="sub" style={{ marginTop: 6 }}>“{item.quote}”</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
