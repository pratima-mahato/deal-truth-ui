import type { BuyerSentiment, Transcript } from "@/api/contracts";
import { EvidenceReceipt } from "@/components/evidence/EvidenceReceipt";
import { formatClock } from "@/lib/utils";
import { resolveSegment } from "@/lib/evidence";

const INTENT_FROM_LABEL: Array<{ pattern: RegExp; value: number }> = [
  { pattern: /frustrat|pain|status quo/i, value: 0.6 },
  { pattern: /interest|intent|enthusias|optim/i, value: 0.85 },
  { pattern: /pric|hesitant|weak/i, value: -0.4 },
  { pattern: /block|security|would not|skeptic/i, value: -0.85 },
];

function intentFor(point: BuyerSentiment["points"][number]): number {
  if (typeof point.intentValence === "number") return point.intentValence;
  const hit = INTENT_FROM_LABEL.find((rule) => rule.pattern.test(`${point.label} ${point.emotions.join(" ")}`));
  return hit?.value ?? point.valence;
}

export function SentimentChart({
  sentiment,
  unavailable,
  transcript,
}: {
  sentiment: BuyerSentiment;
  unavailable?: boolean;
  transcript?: Transcript;
}) {
  if (unavailable || sentiment.points.length === 0) {
    return (
      <div className="card pad-lg">
        <div className="h-sec" style={{ marginBottom: 8 }}>
          Emotion is not buying intent
        </div>
        <p className="sub">
          Emotion analysis is temporarily unavailable. Transcript and deal intelligence are still available.
        </p>
      </div>
    );
  }

  const width = 760;
  const height = 118;
  const duration = Math.max(...sentiment.points.map((point) => point.startMs), 1);
  const xFor = (ms: number) => 28 + (ms / duration) * (width - 46);
  const yFor = (value: number) => height / 2 - value * (height / 2 - 16);
  const emotion = sentiment.points.map((point) => `${xFor(point.startMs).toFixed(1)},${yFor(point.valence).toFixed(1)}`).join(" ");
  const intent = sentiment.points
    .map((point) => `${xFor(point.startMs).toFixed(1)},${yFor(intentFor(point)).toFixed(1)}`)
    .join(" ");
  const diverge =
    sentiment.points.find((point) => point.valence <= 0.35 && intentFor(point) > 0.4 && /frustrat|pain|status/i.test(`${point.label} ${point.emotions.join(" ")}`)) ??
    sentiment.points.find((point) => point.valence < intentFor(point) - 0.25) ??
    sentiment.points[1];
  const divergeSeg = transcript ? resolveSegment(transcript, diverge?.evidence.segmentIds[0]) : undefined;

  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 4 }}>
        <span className="h-sec">Emotion is not buying intent</span>
        <span className="tiny">three axes, never merged into one number</span>
      </div>
      <div className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>
        {sentiment.disclaimer} {sentiment.overall ? `${sentiment.overall} ` : null}
        {sentiment.trajectory}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <line x1="28" y1={height / 2} x2={width - 18} y2={height / 2} stroke="var(--line)" strokeWidth="1" />
        <polyline fill="none" stroke="var(--unproven)" strokeWidth="2.2" strokeDasharray="5 4" points={emotion} />
        <polyline fill="none" stroke="var(--proof)" strokeWidth="2.2" points={intent} />
        {sentiment.points.map((point) => (
          <circle
            key={point.id}
            cx={xFor(point.startMs)}
            cy={yFor(intentFor(point))}
            r="4"
            fill="var(--proof)"
          >
            <title>
              {point.label} · {formatClock(point.startMs)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="hstack" style={{ gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        <span className="tiny">
          <i className="dot" style={{ display: "inline-block", color: "var(--unproven)" }} /> dashed · emotion valence
        </span>
        <span className="tiny">
          <i className="dot" style={{ display: "inline-block", color: "var(--proof)" }} /> solid · commercial intent
        </span>
      </div>
      {diverge ? (
        <div style={{ marginTop: 12 }}>
          <p className="sub" style={{ fontSize: 12.5, marginBottom: 8 }}>
            <b>
              Emotion: {diverge.emotions[0] || diverge.label}. Buying intent: positive.
            </b>{" "}
            Frustration aimed at the status quo is a buying signal, not a negative one. A single blended sentiment score
            would have read this backwards. {formatClock(diverge.startMs)}.
          </p>
          <EvidenceReceipt segment={divergeSeg} transcript={transcript} status="UNCONFIRMED" compact />
        </div>
      ) : null}
    </div>
  );
}
