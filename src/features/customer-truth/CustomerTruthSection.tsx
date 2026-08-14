import type { CustomerFact, CustomerTruthCategory, Transcript } from "@/api/contracts";
import { CUSTOMER_TRUTH_CATEGORIES } from "@/api/contracts";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { EvidenceReceipt } from "@/components/evidence/EvidenceReceipt";
import { ArrowGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { evidenceToStamp, resolveSegment } from "@/lib/evidence";

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

export function CustomerTruthSection({
  facts,
  transcript,
}: {
  facts: CustomerFact[];
  transcript?: Transcript;
}) {
  const { setFocus } = useEvidenceFocus();

  return (
    <div>
      <div className="between" style={{ marginBottom: 10, flexWrap: "wrap" }}>
        <span className="h-sec">Customer truth</span>
        <span className="tiny">customer segments only — the rep's words are never quoted here</span>
      </div>
      {facts.length === 0 ? (
        <p className="sub">No customer-stated facts with evidence on this call.</p>
      ) : (
        <div className="split">
          {CUSTOMER_TRUTH_CATEGORIES.flatMap((category) => facts.filter((f) => f.category === category)).map((fact) => {
            const segment = transcript ? resolveSegment(transcript, fact.evidence.segmentIds[0]) : undefined;
            const stamp = evidenceToStamp(fact.evidenceStatus, fact.category === "blocker");
            return (
              <article key={fact.id} className="card pad reveal">
                <div className="between" style={{ marginBottom: 7 }}>
                  <span className={`chip ${fact.evidenceStatus === "SUPPORTED" ? "proof" : "absent"}`}>
                    {labels[fact.category]}
                  </span>
                  <EvidenceStamp status={stamp} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-.01em", marginBottom: 4 }}>{fact.title}</div>
                <div className="sub" style={{ fontSize: 12.5, marginBottom: 9 }}>
                  {fact.summary}
                </div>
                <EvidenceReceipt segment={segment} transcript={transcript} status={stamp} compact />
                <div className="hstack" style={{ marginTop: 9 }}>
                  <button
                    type="button"
                    className="btn sm ghost"
                    onClick={() =>
                      setFocus({
                        insightId: fact.id,
                        segmentIds: fact.evidence.segmentIds,
                        play: false,
                        drawer: {
                          id: fact.id,
                          title: fact.title,
                          kind: "fact",
                          why: fact.summary,
                          quote: fact.quote,
                          speakerName: fact.speakerName,
                          evidenceStatus: fact.evidenceStatus,
                        },
                      })
                    }
                  >
                    Why we think this <ArrowGlyph />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
