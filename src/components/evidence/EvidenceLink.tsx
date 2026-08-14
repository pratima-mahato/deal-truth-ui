import { PlayGlyph, ArrowGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus, type InsightDrawerPayload } from "./EvidenceFocusContext";
import type { EvidenceRef } from "@/api/contracts";

export function EvidenceLink({
  evidence,
  insightId,
  disabled,
  drawer,
}: {
  evidence: EvidenceRef;
  insightId?: string;
  disabled?: boolean;
  drawer?: InsightDrawerPayload;
}) {
  const { setFocus } = useEvidenceFocus();
  const has = evidence.segmentIds.length > 0;
  return (
    <div className="hstack" style={{ flexWrap: "wrap", marginTop: 10 }}>
      <button
        type="button"
        className="btn sm play"
        disabled={disabled || !has}
        aria-label="Play evidence"
        onClick={() => setFocus({ insightId, segmentIds: evidence.segmentIds, play: true, drawer })}
      >
        <PlayGlyph />
        <span>Play evidence</span>
      </button>
      <button
        type="button"
        className="btn sm ghost"
        disabled={!has}
        onClick={() => setFocus({ insightId, segmentIds: evidence.segmentIds, play: false, drawer })}
      >
        Why we think this <ArrowGlyph />
      </button>
    </div>
  );
}
