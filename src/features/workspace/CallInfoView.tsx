import type { CallReport, Transcript } from "@/api/contracts";
import { Card } from "@/components/ui/Card";
import { formatDate, formatDuration } from "@/lib/utils";
import { downloadCallExport } from "@/api/endpoints/calls";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export function CallInfoView({
  report,
  transcript,
}: {
  report: CallReport;
  transcript: Transcript;
}) {
  const call = report.call;
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"json" | "markdown" | null>(null);

  async function exportFile(format: "json" | "markdown") {
    setExportError(null);
    setExporting(format);
    try {
      await downloadCallExport(call.id, format);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Call</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Customer" value={call.customerName} />
          <Row label="Rep" value={call.repName} />
          <Row label="Direction" value={call.callDirection} />
          <Row label="Date" value={formatDate(call.createdAt)} />
          <Row label="Duration" value={formatDuration(call.durationMs)} />
          <Row label="Language" value={call.language} />
          <Row label="Source" value={call.sourceType} />
        </dl>
      </Card>
      <Card className="p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Participants</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {transcript.speakers.map((speaker) => (
            <li key={speaker.id} className="flex justify-between">
              <span className="font-medium text-ink-900">{speaker.displayName}</span>
              <span className="capitalize text-ink-500">{speaker.role}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Talk ratio</h3>
          <p className="mt-2 text-sm text-ink-700">
            Seller {Math.round(report.metrics.talkRatio.sellerPct)}% · Customer {Math.round(report.metrics.talkRatio.customerPct)}%
          </p>
        </div>
      </Card>
      <Card className="p-5 md:col-span-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Export</h2>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => void exportFile("json")} disabled={exporting != null}>
            {exporting === "json" ? "Downloading…" : "JSON"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void exportFile("markdown")} disabled={exporting != null}>
            {exporting === "markdown" ? "Downloading…" : "Markdown"}
          </Button>
        </div>
        {exportError ? <p className="mt-2 text-sm text-red-700">{exportError}</p> : null}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value}</dd>
    </div>
  );
}
