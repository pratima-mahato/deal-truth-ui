import type { ManagerBrief } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ManagerBriefPanel({ brief }: { brief: ManagerBrief }) {
  function copy() {
    const text = [
      brief.dealLabel,
      `Why they buy: ${brief.whyTheyBuy}`,
      `Why they don't: ${brief.whyTheyDont.join("; ")}`,
      `Intent: ${brief.intent}`,
      `Competition: ${brief.competition}`,
      `Biggest risk: ${brief.biggestRisk}`,
      `Customer commitment: ${brief.customerCommitment}`,
      `Next move: ${brief.nextMove}`,
    ].join("\n");
    void navigator.clipboard.writeText(text);
  }

  return (
    <Card>
      <CardHeader title="Manager Brief" action={<Button size="sm" variant="secondary" onClick={copy}>Copy</Button>} />
      <dl className="grid gap-3 p-5 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Why they buy</dt>
          <dd className="mt-1">{brief.whyTheyBuy}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Why they don't</dt>
          <dd className="mt-1">
            <ul className="list-disc pl-4">
              {brief.whyTheyDont.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Intent</dt>
          <dd className="mt-1">{brief.intent}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Competition</dt>
          <dd className="mt-1">{brief.competition}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Biggest risk</dt>
          <dd className="mt-1">{brief.biggestRisk}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Customer commitment</dt>
          <dd className="mt-1">{brief.customerCommitment}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-xs font-semibold uppercase text-slate-500">Next move</dt>
          <dd className="mt-1 font-medium">{brief.nextMove}</dd>
        </div>
      </dl>
    </Card>
  );
}
