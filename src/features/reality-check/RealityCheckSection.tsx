import type { RealityCheck } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";

export function RealityCheckSection({ checks }: { checks: RealityCheck[] }) {
  return (
    <Card>
      <CardHeader
        title="Reality Check"
        description="What the seller implied versus what the customer actually said."
      />
      <div className="space-y-4 p-5">
        {checks.length === 0 ? (
          <p className="text-sm text-slate-500">No mismatches detected.</p>
        ) : (
          checks.map((item) => (
            <article key={item.id} className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <SeverityBadge severity={item.severity} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-white p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Seller implied</p>
                  <p className="mt-1 text-sm">“{item.sellerClaim}”</p>
                  {item.sellerEvidence ? (
                    <EvidenceLink evidence={item.sellerEvidence} insightId={`${item.id}-seller`} />
                  ) : null}
                </div>
                <div className="rounded-md bg-white p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Customer reality</p>
                  <p className="mt-1 text-sm">“{item.customerReality}”</p>
                  <EvidenceLink evidence={item.customerEvidence} insightId={`${item.id}-customer`} />
                </div>
              </div>
              <p className="mt-3 text-sm text-amber-950">{item.reason}</p>
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
