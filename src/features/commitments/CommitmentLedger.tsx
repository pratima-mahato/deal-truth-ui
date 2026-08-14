import type { Commitment, Transcript } from "@/api/contracts";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { formatClock } from "@/lib/utils";
import { resolveSegment } from "@/lib/evidence";

function toneFor(status: Commitment["status"]): "proof" | "unproven" | "blocker" {
  if (status === "committed") return "proof";
  if (status === "not_committed") return "blocker";
  return "unproven";
}

function labelFor(status: Commitment["status"]): string {
  if (status === "committed") return "Committed";
  if (status === "not_committed") return "Not committed";
  if (status === "no_date") return "No date given";
  return "Unconfirmed";
}

function Column({
  title,
  items,
  transcript,
}: {
  title: string;
  items: Commitment[];
  transcript?: Transcript;
}) {
  const { setFocus } = useEvidenceFocus();
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 9 }}>
        {title}
      </div>
      <div className="vstack" style={{ gap: 8 }}>
        {items.map((item) => {
          const cls = toneFor(item.status);
          const segment = transcript ? resolveSegment(transcript, item.evidence.segmentIds[0]) : undefined;
          return (
            <div
              key={item.id}
              style={{
                border: `1px solid var(--${cls}-line)`,
                background: `var(--${cls}-soft)`,
                borderRadius: 11,
                padding: "10px 12px",
              }}
            >
              <div className="between" style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{item.action}</span>
                <span className={`chip ${cls}`}>{labelFor(item.status)}</span>
              </div>
              <div className="tiny">
                {item.owner}
                {item.dueText ? ` · due ${item.dueText}` : " · no date"}
              </div>
              {segment ? (
                <button
                  type="button"
                  className="btn sm play"
                  style={{ marginTop: 7 }}
                  onClick={() => setFocus({ insightId: item.id, segmentIds: item.evidence.segmentIds, play: true })}
                >
                  <PlayGlyph />
                  <span className="mono">{formatClock(segment.startMs)}</span>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CommitmentLedger({
  commitments,
  transcript,
}: {
  commitments: Commitment[];
  transcript?: Transcript;
}) {
  const missingMeeting = commitments.some((c) => c.status === "not_committed" && c.side === "customer");
  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 12 }}>
        <span className="h-sec">Commitment ledger</span>
        {missingMeeting ? <span className="chip blocker">customer has not committed to a next meeting</span> : null}
      </div>
      <div className="split">
        <Column title="Your team" items={commitments.filter((c) => c.side === "seller")} transcript={transcript} />
        <Column title="The customer" items={commitments.filter((c) => c.side === "customer")} transcript={transcript} />
      </div>
    </div>
  );
}
