import type { Battlecard, Commitment, Transcript } from "@/api/contracts";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";

function sendItems(card: Battlecard, commitments?: Commitment[]): string[] {
  const fromSeller = (commitments ?? [])
    .filter((item) => item.side === "seller" && item.status === "committed")
    .map((item) => (item.dueText ? `${item.action} (committed ${item.dueText})` : item.action));
  if (fromSeller.length) return fromSeller;
  return card.doNotForget.filter((item) => !/^do not/i.test(item));
}

export function BattlecardPanel({
  card,
  transcript,
  commitments,
}: {
  card: Battlecard;
  transcript?: Transcript;
  commitments?: Commitment[];
}) {
  const { setFocus } = useEvidenceFocus();
  const sendList = sendItems(card, commitments);

  return (
    <div className="card pad-lg reveal" style={{ borderColor: "var(--brand-line)" }}>
      <div className="between" style={{ marginBottom: 10 }}>
        <span className="h-sec">Next call battlecard</span>
        <span className="chip brand">built only from proven facts</span>
      </div>
      <div className="serif" style={{ fontSize: 21, lineHeight: 1.3, letterSpacing: "-.01em", marginBottom: 14 }}>
        {card.goal}
      </div>
      <div className="split3">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Ask these
          </div>
          <ol className="vstack" style={{ gap: 7 }}>
            {card.questions.map((question, index) => (
              <li key={question} className="hstack" style={{ alignItems: "flex-start", gap: 8 }}>
                <span className="mono" style={{ color: "var(--brand)", fontWeight: 700, fontSize: 12 }}>
                  {index + 1}
                </span>
                <span style={{ fontSize: 12.5, lineHeight: 1.55 }}>{question}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Be ready for
          </div>
          <div className="vstack" style={{ gap: 8 }}>
            {card.prepareFor.map((item) => {
              const evidenceId =
                item.evidenceSegmentIds?.[0] ??
                transcript?.segments.find((segment) =>
                  item.title.toLowerCase().includes("pric") ? /400|double|800/i.test(segment.text) : false,
                )?.id;
              return (
                <div
                  key={item.title}
                  style={{
                    border: "1px solid var(--unproven-line)",
                    background: "var(--unproven-soft)",
                    borderRadius: 10,
                    padding: "9px 11px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 3 }}>{item.title}</div>
                  <div className="sub" style={{ fontSize: 12, lineHeight: 1.55 }}>
                    {item.detail}
                  </div>
                  {evidenceId ? (
                    <button
                      type="button"
                      className="btn sm play"
                      style={{ marginTop: 7 }}
                      onClick={() => setFocus({ insightId: item.title, segmentIds: [evidenceId], play: true })}
                    >
                      <PlayGlyph />
                      <span>Hear it</span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Send before Tuesday
          </div>
          <div className="vstack" style={{ gap: 6 }}>
            {sendList.map((item) => (
              <div key={item} className="hstack" style={{ alignItems: "flex-start", gap: 7 }}>
                <span style={{ color: "var(--proof)", marginTop: 2 }}>✓</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
          {card.missingFields.length ? (
            <div
              style={{
                marginTop: 12,
                padding: "9px 11px",
                borderRadius: 10,
                border: "1px dashed var(--absent-line)",
                background: "var(--absent-soft)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 5 }}>
                Still unknown
              </div>
              <div className="tiny">{card.missingFields.join(" · ")}</div>
            </div>
          ) : null}
        </div>
      </div>
      {card.warning ? (
        <div
          className="hstack"
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--blocker-soft)",
            border: "1px solid var(--blocker-line)",
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: "var(--blocker)", fontWeight: 800 }}>⚠</span>
          <span style={{ fontSize: 12.5 }}>{card.warning}</span>
        </div>
      ) : null}
    </div>
  );
}
