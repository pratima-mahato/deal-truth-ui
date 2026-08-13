import { Play, Quote } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
    <div className="mt-3 flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled || !has}
        onClick={() => setFocus({ insightId, segmentIds: evidence.segmentIds, play: true, drawer })}
      >
        <Play className="h-3.5 w-3.5" />
        Play evidence
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!has}
        onClick={() => setFocus({ insightId, segmentIds: evidence.segmentIds, play: false, drawer })}
      >
        <Quote className="h-3.5 w-3.5" />
        Why we think this
      </Button>
    </div>
  );
}
