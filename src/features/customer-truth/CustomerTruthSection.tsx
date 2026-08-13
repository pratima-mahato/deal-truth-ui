import type { CustomerFact, CustomerTruthCategory } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { EvidenceStatusBadge } from "@/components/ui/Badge";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { CUSTOMER_TRUTH_CATEGORIES } from "@/api/contracts";

const labels: Record<CustomerTruthCategory, string> = {
  pain: "Pain",
  requirement: "Requirement",
  buying_signal: "Buying signal",
  blocker: "Blocker",
  budget: "Budget",
  timeline: "Timeline",
  competition: "Competition",
  commitment: "Commitment",
};

export function CustomerTruthSection({ facts }: { facts: CustomerFact[] }) {
  return (
    <Card>
      <CardHeader
        title="Customer Truth"
        description="Only statements the customer actually made. Unconfirmed items stay unconfirmed."
      />
      <div className="grid gap-3 p-5 md:grid-cols-2">
        {CUSTOMER_TRUTH_CATEGORIES.map((category) => {
          const items = facts.filter((f) => f.category === category);
          if (!items.length) return null;
          return items.map((fact) => (
            <article key={fact.id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {labels[fact.category]}
                </p>
                <EvidenceStatusBadge status={fact.evidenceStatus} />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-navy-900">{fact.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{fact.summary}</p>
              {fact.quote ? (
                <blockquote className="mt-3 border-l-2 border-navy-800 pl-3 text-sm italic text-navy-800">
                  “{fact.quote}”
                </blockquote>
              ) : (
                <p className="mt-3 text-sm text-amber-800">No evidence found.</p>
              )}
              {fact.speakerName ? (
                <p className="mt-2 text-xs text-slate-500">{fact.speakerName}</p>
              ) : null}
              <EvidenceLink evidence={fact.evidence} insightId={fact.id} />
            </article>
          ));
        })}
      </div>
    </Card>
  );
}
