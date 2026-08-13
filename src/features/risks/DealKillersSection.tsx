import type { DealRisk } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { EvidenceStatusBadge, SeverityBadge } from "@/components/ui/Badge";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { cn } from "@/lib/utils";

export function DealKillersSection({ risks }: { risks: DealRisk[] }) {
  return (
    <Card>
      <CardHeader
        title="Deal Killers"
        description="Supported risks cite the transcript. Absence-based risks are missing signals, not invented quotes."
      />
      <div className="space-y-3 p-5">
        {risks.map((risk) => (
          <article
            key={risk.id}
            className={cn(
              "rounded-lg border p-4",
              risk.evidenceStatus === "SUPPORTED" && "border-red-200 bg-red-50/40",
              risk.evidenceStatus === "ABSENCE_BASED" && "border-amber-200 bg-amber-50/40",
              risk.evidenceStatus === "UNCONFIRMED" && "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{risk.title}</h3>
              <SeverityBadge severity={risk.severity} />
              <EvidenceStatusBadge status={risk.evidenceStatus} />
            </div>
            <p className="mt-2 text-sm text-slate-700">{risk.summary}</p>
            {risk.evidenceStatus === "ABSENCE_BASED" ? (
              <p className="mt-2 text-xs text-amber-800">Not a customer quote — this field was never identified on the call.</p>
            ) : (
              <EvidenceLink evidence={risk.evidence} insightId={risk.id} />
            )}
          </article>
        ))}
      </div>
    </Card>
  );
}
