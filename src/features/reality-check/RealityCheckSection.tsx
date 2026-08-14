import type { RealityCheck, Transcript } from "@/api/contracts";
import { formatClock } from "@/lib/utils";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { useAudioPlayerOptional } from "@/components/audio/AudioPlayerProvider";
import { resolveSegment, speakerFor } from "@/lib/evidence";

export function RealityCheckSection({
  checks,
  transcript,
}: {
  checks: RealityCheck[];
  transcript?: Transcript;
}) {
  if (!checks.length) {
    return (
      <div className="card pad">
        <p className="sub">No mismatches detected.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="between" style={{ marginBottom: 10 }}>
        <span className="h-sec">Reality check</span>
        <span className="tiny">what the rep believes vs what the customer actually said</span>
      </div>
      <div className="vstack" style={{ gap: 12 }}>
        {checks.map((item) => (
          <RealityCheckCard key={item.id} check={item} transcript={transcript} />
        ))}
      </div>
    </div>
  );
}

function RealityCheckCard({ check, transcript }: { check: RealityCheck; transcript?: Transcript }) {
  const { setFocus } = useEvidenceFocus();
  const audio = useAudioPlayerOptional();
  const sellerSeg = transcript ? resolveSegment(transcript, check.sellerEvidence?.segmentIds[0]) : undefined;
  const customerSeg = transcript ? resolveSegment(transcript, check.customerEvidence.segmentIds[0]) : undefined;
  const sellerName = transcript && sellerSeg ? speakerFor(transcript, sellerSeg) : "The rep";
  const customerName = transcript && customerSeg ? speakerFor(transcript, customerSeg) : "The customer";
  const code = /meeting|commit/i.test(check.title) ? "NO_EXPLICIT_COMMITMENT" : "OVERSTATED_INTENT";

  function play(ids: string[] | undefined, segment?: { startMs: number; endMs: number }) {
    if (!ids?.length) return;
    setFocus({ insightId: check.id, segmentIds: ids, play: true });
    if (segment) void audio?.playRange(segment.startMs, segment.endMs);
  }

  return (
    <article className="reality">
      <div className="reality-top">
        <span className="chip unproven">⚠ Reality check</span>
        <span style={{ fontWeight: 800, fontSize: 13.5 }}>{check.title}</span>
        <span className="grow" />
        <span className="mono tiny">{code}</span>
      </div>
      <div className="reality-grid">
        <div className="reality-side said">
          <div className="reality-label">
            <i className="dot" style={{ color: "var(--unproven)" }} />
            <span className="reality-who">
              {sellerName} — the rep — implied
            </span>
          </div>
          <div className="reality-quote">“{sellerSeg?.text ?? check.sellerClaim}”</div>
          {sellerSeg ? (
            <button
              type="button"
              className="btn sm"
              aria-label={`Play evidence, ${sellerName} at ${formatClock(sellerSeg.startMs)}`}
              onClick={() => play(check.sellerEvidence?.segmentIds, sellerSeg)}
            >
              <PlayGlyph />
              <span className="mono">{formatClock(sellerSeg.startMs)}</span>
            </button>
          ) : null}
        </div>
        <div className="reality-vs">
          <div className="vs-badge">VS</div>
        </div>
        <div className="reality-side truth">
          <div className="reality-label">
            <i className="dot" style={{ color: "var(--proof)" }} />
            <span className="reality-who">
              {customerName} — the customer — said
            </span>
          </div>
          <div className="reality-quote">“{customerSeg?.text ?? check.customerReality}”</div>
          {customerSeg ? (
            <button
              type="button"
              className="btn sm play"
              aria-label={`Play evidence, ${customerName} at ${formatClock(customerSeg.startMs)}`}
              onClick={() => play(check.customerEvidence.segmentIds, customerSeg)}
            >
              <PlayGlyph />
              <span className="mono">{formatClock(customerSeg.startMs)}</span>
            </button>
          ) : (
            <button type="button" className="btn sm play" onClick={() => play(check.customerEvidence.segmentIds)}>
              <PlayGlyph />
              <span>Play evidence</span>
            </button>
          )}
        </div>
      </div>
      <div className="reality-verdict">
        <EvidenceStamp status="BLOCKER" />
        <span style={{ fontSize: 13, lineHeight: 1.5 }}>{check.reason}</span>
      </div>
    </article>
  );
}
