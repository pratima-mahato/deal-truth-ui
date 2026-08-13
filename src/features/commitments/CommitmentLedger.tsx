import type { Commitment } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { Alert } from "@/components/ui/Alert";

function Column({ title, items }: { title: string; items: Commitment[] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.action}</p>
              <Badge
                tone={
                  item.status === "committed" ? "positive" : item.status === "not_committed" ? "danger" : "warning"
                }
              >
                {item.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {item.owner}
              {item.dueText ? ` · ${item.dueText}` : ""}
            </p>
            {item.evidence.segmentIds.length ? <EvidenceLink evidence={item.evidence} insightId={item.id} /> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function CommitmentLedger({ commitments }: { commitments: Commitment[] }) {
  const missingMeeting = commitments.some((c) => c.status === "not_committed");
  return (
    <Card>
      <CardHeader title="Commitment Ledger" description="Seller promises versus customer promises, each with evidence." />
      <div className="space-y-4 p-5">
        {missingMeeting ? (
          <Alert tone="danger" title="Customer has not committed to a next meeting" />
        ) : null}
        <div className="grid gap-6 md:grid-cols-2">
          <Column title="Your team" items={commitments.filter((c) => c.side === "seller")} />
          <Column title="Customer" items={commitments.filter((c) => c.side === "customer")} />
        </div>
      </div>
    </Card>
  );
}
