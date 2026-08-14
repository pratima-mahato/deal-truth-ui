import type { Objection, Transcript } from "@/api/contracts";
import { EvidenceReceipt } from "@/components/evidence/EvidenceReceipt";
import { Chip } from "@/components/ui/Badge";
import { resolveSegment } from "@/lib/evidence";

export function ObjectionsSection({
  objections,
  transcript,
}: {
  objections: Objection[];
  transcript?: Transcript;
}) {
  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 10 }}>
        <span className="h-sec">Objections, and how to handle them</span>
        <span className="tiny">cited from the customer</span>
      </div>
      {objections.length === 0 ? (
        <p className="sub">No objections with evidence on this call.</p>
      ) : (
        <div className="vstack" style={{ gap: 12 }}>
          {objections.map((item) => {
            const segment = transcript ? resolveSegment(transcript, item.evidence.segmentIds[0]) : undefined;
            return (
              <article key={item.id}>
                <div className="between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{item.title}</span>
                  <Chip tone={item.severity === "high" ? "blocker" : "unproven"}>{item.kind}</Chip>
                </div>
                <div className="sub" style={{ fontSize: 12.5, marginBottom: 8 }}>
                  {item.summary}
                </div>
                <EvidenceReceipt segment={segment} transcript={transcript} compact />
                {item.coaching ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "var(--brand-soft)",
                      border: "1px solid var(--brand-line)",
                    }}
                  >
                    <div className="eyebrow" style={{ marginBottom: 5, color: "var(--brand)" }}>
                      Next time, say this
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55 }}>{item.coaching}</div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
