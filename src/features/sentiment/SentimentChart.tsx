import type { BuyerSentiment } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatClock } from "@/lib/utils";

export function SentimentChart({ sentiment, unavailable }: { sentiment: BuyerSentiment; unavailable?: boolean }) {
  if (unavailable || sentiment.points.length === 0) {
    return (
      <Card>
        <CardHeader title="Sentiment and emotion" />
        <div className="p-5">
          <Alert
            tone="warning"
            title="Emotion analysis is temporarily unavailable"
          >
            Transcript and deal intelligence are still available. Emotion is not buying intent.
          </Alert>
        </div>
      </Card>
    );
  }

  const data = sentiment.points.map((p) => ({
    t: formatClock(p.startMs),
    valence: p.valence,
    label: p.label,
  }));

  return (
    <Card>
      <CardHeader title="Sentiment and emotion" description={sentiment.disclaimer} />
      <div className="p-5">
        <p className="text-sm text-slate-600">{sentiment.overall}</p>
        <p className="mt-1 text-xs text-slate-500">{sentiment.trajectory}</p>
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="t" tick={{ fontSize: 11 }} />
              <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="valence" stroke="#0f1c2e" dot strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {sentiment.points.map((point) => (
            <li key={point.id} className="flex items-start justify-between gap-3">
              <span>
                <span className="font-mono text-xs text-slate-500">{formatClock(point.startMs)}</span> {point.label}{" "}
                <span className="text-slate-500">({point.emotions.join(", ")})</span>
              </span>
              <EvidenceLink evidence={point.evidence} insightId={point.id} />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
