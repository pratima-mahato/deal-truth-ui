import type { ManagerBrief } from "@/api/contracts";
import type { DimensionTile } from "@/lib/evidence";
import { GATE_CLAIMS_REFUSED, GATE_CLAIMS_SHIPPED, splitProse } from "@/lib/evidence";
import { downloadCallExport } from "@/api/endpoints/calls";
import { useState } from "react";

export function ManagerBriefPanel({
  brief,
  tiles,
  callId,
}: {
  brief: ManagerBrief;
  tiles?: DimensionTile[];
  callId?: string;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const whyBuy = splitProse(brief.whyTheyBuy);
  const missing = (tiles ?? []).filter((tile) => tile.state === "missing");

  function copy() {
    const text = [
      brief.dealLabel,
      `Why they buy: ${whyBuy.join(" ")}`,
      `Why they don't: ${brief.whyTheyDont.join("; ")}`,
      brief.intent ? `Intent: ${brief.intent}` : "",
      brief.competition ? `Competition: ${brief.competition}` : "",
      `Biggest risk: ${brief.biggestRisk}`,
      `Next move: ${brief.nextMove}`,
    ]
      .filter(Boolean)
      .join("\n");
    void navigator.clipboard.writeText(text);
  }

  async function exportMarkdown() {
    if (!callId) return;
    setExportError(null);
    setExporting(true);
    try {
      await downloadCallExport(callId, "markdown");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 5 }}>
            Manager brief · 30 seconds
          </div>
          <div className="serif" style={{ fontSize: 26, letterSpacing: "-.015em" }}>
            {brief.dealLabel}
          </div>
        </div>
        <div className="hstack">
          <button type="button" className="btn sm" onClick={copy}>
            Copy
          </button>
          {callId ? (
            <button type="button" className="btn sm" onClick={() => void exportMarkdown()} disabled={exporting}>
              {exporting ? "Exporting…" : "Export .md"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="split">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8, color: "var(--proof)" }}>
            Why they buy
          </div>
          <ul className="vstack" style={{ gap: 7 }}>
            {whyBuy.map((item) => (
              <li key={item} className="hstack" style={{ alignItems: "flex-start", gap: 8 }}>
                <span className="dot" style={{ color: "var(--proof)", marginTop: 6 }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8, color: "var(--blocker)" }}>
            Why they don't
          </div>
          <ul className="vstack" style={{ gap: 7 }}>
            {brief.whyTheyDont.map((item) => (
              <li key={item} className="hstack" style={{ alignItems: "flex-start", gap: 8 }}>
                <span className="dot" style={{ color: "var(--blocker)", marginTop: 6 }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="split" style={{ marginTop: 16 }}>
        <div
          style={{
            border: "1px solid var(--blocker-line)",
            background: "var(--blocker-soft)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 5 }}>
            Biggest risk
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>{brief.biggestRisk}</div>
        </div>
        <div
          style={{
            border: "1px solid var(--brand-line)",
            background: "var(--brand-soft)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 5, color: "var(--brand)" }}>
            Next move
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>{brief.nextMove}</div>
        </div>
      </div>
      <div className="hstack" style={{ marginTop: 14, flexWrap: "wrap" }}>
        <span className="chip unproven">Customer commitment: {brief.customerCommitment}</span>
        {missing.map((tile) => (
          <span key={tile.id} className="chip absent">
            No {tile.label.replace(/ identified$/i, "").toLowerCase()}
          </span>
        ))}
        <span className="chip proof">{GATE_CLAIMS_SHIPPED} claims with proof</span>
        <span className="chip blocker">{GATE_CLAIMS_REFUSED} claims refused</span>
      </div>
      {brief.intent || brief.competition ? (
        <div className="sub" style={{ fontSize: 12.5, marginTop: 12 }}>
          {brief.intent ? <>{brief.intent} </> : null}
          {brief.competition ? <>Competition: {brief.competition}</> : null}
        </div>
      ) : null}
      {exportError ? <p className="tiny" style={{ marginTop: 8, color: "var(--blocker)" }}>{exportError}</p> : null}
    </div>
  );
}
