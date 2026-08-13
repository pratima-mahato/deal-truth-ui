import type { Battlecard } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";

export function BattlecardPanel({ card }: { card: Battlecard }) {
  return (
    <Card>
      <CardHeader title="Next Call Battlecard" description="What to do next — not just what happened." />
      <div className="space-y-4 p-5 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Goal</p>
          <p className="mt-1 font-medium">{card.goal}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Ask these</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {card.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Be ready for</p>
          {card.prepareFor.map((item) => (
            <div key={item.title} className="mt-2 rounded-md bg-slate-50 p-3">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Don't forget</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {card.doNotForget.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        {card.missingFields.length ? (
          <p className="text-amber-800">Missing qualification: {card.missingFields.join(", ")}</p>
        ) : null}
      </div>
    </Card>
  );
}
