import type { Objection } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";

export function ObjectionsSection({ objections }: { objections: Objection[] }) {
  return (
    <Card>
      <CardHeader title="Objections" description="Cited from the customer, with a suggested response for next time." />
      <div className="space-y-3 p-5">
        {objections.length === 0 ? (
          <p className="text-sm text-slate-500">No objections with evidence on this call.</p>
        ) : (
          objections.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.kind}</p>
                <SeverityBadge severity={item.severity} />
              </div>
              <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
              {item.coaching ? (
                <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-navy-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How to handle it</p>
                  <p className="mt-1">{item.coaching}</p>
                </div>
              ) : null}
              <EvidenceLink evidence={item.evidence} insightId={item.id} />
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
