import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatClock } from "@/lib/utils";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import type { ClickableInsight, OverviewModel, Tone } from "./overviewModel";

function toneClass(tone: Tone): string {
  if (tone === "positive") return "border-emerald-100 bg-emerald-50/80";
  if (tone === "danger") return "border-red-100 bg-red-50/80";
  if (tone === "warning") return "border-amber-100 bg-amber-50/70";
  if (tone === "info") return "border-sky-100 bg-sky-50/80";
  return "border-ink-100 bg-white";
}

function SignalRow({ item }: { item: ClickableInsight }) {
  const { setFocus } = useEvidenceFocus();
  return (
    <button
      type="button"
      className="group flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-violet-50"
      onClick={() =>
        setFocus({
          insightId: item.id,
          segmentIds: item.evidence.segmentIds,
          play: false,
          drawer: {
            id: item.id,
            title: item.title,
            kind: item.kind,
            severity: item.severity,
            why: item.why,
            quote: item.quote,
            speakerName: item.speakerName,
            startMs: item.startMs,
            action: item.action,
            evidenceStatus: item.evidenceStatus,
          },
        })
      }
    >
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug text-ink-900">“{item.quote ?? item.title}”</span>
      </span>
      <span className="font-mono text-xs text-ink-400">{item.startMs != null ? formatClock(item.startMs) : ""}</span>
    </button>
  );
}

export function OverviewStory({ model }: { model: OverviewModel }) {
  const { setFocus } = useEvidenceFocus();
  const scoreTone = model.score.score >= 75 ? "positive" : model.score.score >= 55 ? "warning" : "danger";

  return (
    <div className="animate-soft-in space-y-5">
      <Card className="overflow-hidden p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Call intelligence</p>
            <p className="mt-3 text-xl font-semibold leading-snug tracking-tight text-ink-900 text-balance">
              {model.narrative}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4">
            <div className="text-4xl font-semibold tabular-nums text-violet-700">{model.score.score}</div>
            <div>
              <Badge tone={scoreTone}>{model.score.label}</Badge>
              <p className="mt-1 max-w-[11rem] text-xs leading-snug text-ink-500">{model.score.summary}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { label: "Intent", value: model.intent.value, tone: model.intent.tone },
            { label: "Risk", value: model.risk.value, tone: model.risk.tone },
            { label: "Next step", value: model.nextStep.value, tone: model.nextStep.tone },
            { label: "Engagement", value: model.engagement.value, tone: model.engagement.tone },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border px-4 py-3 ${toneClass(card.tone)}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">{card.label}</p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{card.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Buying signals</h2>
          <div className="mt-2 divide-y divide-ink-100/80">
            {model.buyingSignals.map((item) => (
              <SignalRow key={item.id} item={item} />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Attention required</h2>
          <div className="mt-3 space-y-3">
            {model.attention.slice(0, 2).map((item) => (
              <article key={item.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  {item.severity ? (
                    <Badge tone={item.severity === "high" ? "danger" : "warning"}>{item.severity}</Badge>
                  ) : null}
                </div>
                {item.quote ? <p className="mt-2 text-sm leading-relaxed text-ink-700">“{item.quote}”</p> : null}
                <p className="mt-1 font-mono text-[11px] text-ink-400">
                  {item.startMs != null ? formatClock(item.startMs) : ""}
                </p>
                <Button
                  size="sm"
                  variant="link"
                  className="mt-1 px-0"
                  onClick={() =>
                    setFocus({
                      insightId: item.id,
                      segmentIds: item.evidence.segmentIds,
                      play: false,
                      drawer: {
                        id: item.id,
                        title: item.title,
                        kind: item.kind,
                        severity: item.severity,
                        why: item.why,
                        quote: item.quote,
                        speakerName: item.speakerName,
                        startMs: item.startMs,
                        action: item.action,
                        evidenceStatus: item.evidenceStatus,
                      },
                    })
                  }
                >
                  View evidence
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </article>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">AI summary</h2>
        <ul className="mt-3 space-y-2">
          {model.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-ink-700">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-500" />
              {bullet}
            </li>
          ))}
        </ul>
      </Card>

      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Deal intelligence</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {model.intelligence.map((item) => (
            <div key={item.label} className="rounded-xl border border-ink-100 bg-surface px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-ink-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
