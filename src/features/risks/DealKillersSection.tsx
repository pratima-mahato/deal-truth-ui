import type { DealRisk, Transcript } from "@/api/contracts";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { Chip } from "@/components/ui/Badge";
import { PlayGlyph, ArrowGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { evidenceToStamp } from "@/lib/evidence";

export function DealKillersSection({
  risks,
}: {
  risks: DealRisk[];
  transcript?: Transcript;
}) {
  const { setFocus } = useEvidenceFocus();
  const ordered = [...risks].sort((a, b) => {
    if (a.evidenceStatus === b.evidenceStatus) return 0;
    return a.evidenceStatus === "SUPPORTED" ? -1 : 1;
  });

  return (
    <div>
      <div className="between" style={{ marginBottom: 10 }}>
        <span className="h-sec">Deal killers</span>
        <span className="tiny">supported first · absence is a result, not a guess</span>
      </div>
      <div className="vstack" style={{ gap: 10 }}>
        {ordered.map((risk) => {
          const stamp = evidenceToStamp(risk.evidenceStatus, risk.severity === "high");
          return (
            <article
              key={risk.id}
              className="card pad reveal"
              style={{
                borderLeft: `3px solid var(--${risk.evidenceStatus === "SUPPORTED" ? "blocker" : "absent"})`,
              }}
            >
              <div className="between" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{risk.title}</span>
                <span className="hstack">
                  <EvidenceStamp status={stamp} />
                  <Chip tone={risk.severity === "high" ? "blocker" : "unproven"}>{risk.severity}</Chip>
                </span>
              </div>
              <div className="sub" style={{ fontSize: 12.5 }}>
                {risk.summary}
              </div>
              {risk.evidenceStatus === "ABSENCE_BASED" ? (
                <div className="tiny" style={{ marginTop: 8, color: "var(--absent)" }}>
                  Not a customer quote — this dimension was never identified on the call.
                </div>
              ) : (
                <div className="hstack" style={{ flexWrap: "wrap", marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn sm play"
                    onClick={() => setFocus({ insightId: risk.id, segmentIds: risk.evidence.segmentIds, play: true })}
                  >
                    <PlayGlyph />
                    <span>Play evidence</span>
                  </button>
                  <button
                    type="button"
                    className="btn sm ghost"
                    onClick={() =>
                      setFocus({
                        insightId: risk.id,
                        segmentIds: risk.evidence.segmentIds,
                        play: false,
                        drawer: {
                          id: risk.id,
                          title: risk.title,
                          kind: "risk",
                          severity: risk.severity,
                          why: risk.summary,
                          evidenceStatus: risk.evidenceStatus,
                        },
                      })
                    }
                  >
                    Why we think this <ArrowGlyph />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
