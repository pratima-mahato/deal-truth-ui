import type { CallMoment, CompetitorMention } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { formatClock } from "@/lib/utils";

export function MomentsTimeline({ moments }: { moments: CallMoment[] }) {
  const { setFocus } = useEvidenceFocus();
  const max = Math.max(...moments.map((m) => m.startMs), 1);
  return (
    <Card>
      <CardHeader title="Moments that mattered" />
      <div className="p-5">
        <div className="relative h-12">
          <div className="absolute left-0 right-0 top-6 h-px bg-slate-200" />
          {moments.map((moment) => (
            <button
              key={moment.id}
              type="button"
              className="absolute top-2 -translate-x-1/2 text-center"
              style={{ left: `${(moment.startMs / max) * 100}%` }}
              onClick={() => setFocus({ insightId: moment.id, segmentIds: moment.evidence.segmentIds, play: true })}
            >
              <span className="block text-[10px] font-medium text-navy-800">{moment.label}</span>
              <span className="mt-2 block h-2.5 w-2.5 rounded-full bg-navy-900" />
              <span className="mt-1 block font-mono text-[10px] text-slate-500">{formatClock(moment.startMs)}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function CompetitorsSection({ competitors }: { competitors: CompetitorMention[] }) {
  return (
    <Card>
      <CardHeader title="Competitor intelligence" />
      <div className="space-y-3 p-5">
        {competitors.length === 0 ? (
          <p className="text-sm text-slate-500">No competitors mentioned with evidence.</p>
        ) : (
          competitors.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{item.name}</h3>
                <span className="text-xs text-amber-800">{item.stance}</span>
              </div>
              {item.likes?.length ? <p className="mt-2 text-sm">Likes: {item.likes.join(", ")}</p> : null}
              {item.concerns?.length ? (
                <p className="mt-1 text-sm">Concerns: {item.concerns.join(", ")}</p>
              ) : null}
              <EvidenceLink evidence={item.evidence} insightId={item.id} />
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
