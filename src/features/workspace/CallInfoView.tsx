import type { CallReport, Transcript } from "@/api/contracts";
import { formatClock, formatDate } from "@/lib/utils";
import { countSilenceGaps } from "@/lib/evidence";
import { downloadCallExport } from "@/api/endpoints/calls";
import { useState } from "react";

export function CallInfoView({
  report,
  transcript,
}: {
  report: CallReport;
  transcript: Transcript;
}) {
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"json" | "markdown" | null>(null);
  const silenceGaps = report.metrics.silenceGapCount ?? countSilenceGaps(transcript);

  async function exportFile(format: "json" | "markdown") {
    setExportError(null);
    setExporting(format);
    try {
      await downloadCallExport(report.call.id, format);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="card pad-lg reveal">
      <div className="h-sec" style={{ marginBottom: 12 }}>
        Conversation metrics
      </div>
      <div style={{ marginBottom: 7 }}>
        <div style={{ display: "flex", height: 9, borderRadius: 9, overflow: "hidden", gap: 2 }}>
          <i style={{ flex: report.metrics.talkRatio.sellerPct, background: "var(--brand)" }} />
          <i style={{ flex: report.metrics.talkRatio.customerPct, background: "var(--proof)" }} />
        </div>
      </div>
      <div className="between tiny" style={{ marginBottom: 14 }}>
        <span>Rep {Math.round(report.metrics.talkRatio.sellerPct)}%</span>
        <span>Customer {Math.round(report.metrics.talkRatio.customerPct)}%</span>
      </div>
      <dl className="kv">
        <dt>Questions asked</dt>
        <dd className="mono">{report.metrics.questionCount}</dd>
        <dt>Longest monologue</dt>
        <dd className="mono">
          {formatClock(report.metrics.longestMonologue.durationMs)} · {report.metrics.longestMonologue.speakerName}
        </dd>
        <dt>Silence gaps &gt; 2s</dt>
        <dd className="mono">{silenceGaps}</dd>
        <dt>Date</dt>
        <dd>{formatDate(report.call.createdAt)}</dd>
      </dl>
      <div style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Tracked terms
        </div>
        <div className="hstack" style={{ flexWrap: "wrap" }}>
          {report.metrics.keywordHits.map((hit) => (
            <span key={hit.term} className="chip">
              {hit.term} <b>{hit.count}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="hstack" style={{ marginTop: 16 }}>
        <button type="button" className="btn sm" onClick={() => void exportFile("json")} disabled={exporting != null}>
          {exporting === "json" ? "Downloading…" : "Export JSON"}
        </button>
        <button type="button" className="btn sm" onClick={() => void exportFile("markdown")} disabled={exporting != null}>
          {exporting === "markdown" ? "Downloading…" : "Export .md"}
        </button>
      </div>
      {exportError ? <p className="tiny" style={{ marginTop: 8, color: "var(--blocker)" }}>{exportError}</p> : null}
    </div>
  );
}
