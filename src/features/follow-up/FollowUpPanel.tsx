import { useMemo, useState } from "react";
import type { FollowUpEmail, Transcript } from "@/api/contracts";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { useAudioPlayerOptional } from "@/components/audio/AudioPlayerProvider";
import { useFollowUp } from "@/hooks/useCallApi";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/utils";
import { resolveSegment } from "@/lib/evidence";

export function FollowUpPanel({
  callId,
  initial,
  transcript,
}: {
  callId: string;
  initial?: FollowUpEmail;
  transcript?: Transcript;
}) {
  const mutation = useFollowUp(callId);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const { setFocus } = useEvidenceFocus();
  const audio = useAudioPlayerOptional();
  const email = mutation.data ?? initial;
  const sentences = useMemo(() => email?.sentences ?? [], [email]);

  const lines = sentences;

  const unsupportedLeft = useMemo(
    () =>
      lines.filter(
        (s) =>
          (s.kind === "unsupported" || (s.kind === "factual" && s.supported === false)) && !removed.has(s.id),
      ).length,
    [lines, removed],
  );

  function copy() {
    const visible = lines.filter((s) => !removed.has(s.id));
    void navigator.clipboard.writeText(visible.map((s) => s.text).join(" "));
  }

  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 4 }}>
        <span className="h-sec">Evidence-safe follow-up</span>
        <span className={`chip ${unsupportedLeft ? "blocker" : "proof"}`}>
          {unsupportedLeft ? `${unsupportedLeft} unsupported claim${unsupportedLeft > 1 ? "s" : ""}` : "every sentence has a receipt"}
        </span>
      </div>
      <div className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Each factual sentence is tied to a segment. The draft cannot be sent while a sentence claims something the customer never said.
      </div>
      {email ? <p className="tiny" style={{ marginBottom: 10 }}>Subject: {email.subject}</p> : (
        <p className="tiny" style={{ marginBottom: 10 }}>Generate a draft from this call. Factual sentences stay locked to transcript segments.</p>
      )}
      <div className="vstack" style={{ gap: 7 }}>
        {lines.map((sentence) => {
          const gone = removed.has(sentence.id);
          const bad = sentence.kind === "unsupported" || (sentence.kind === "factual" && sentence.supported === false);
          const cls = sentence.kind === "factual" && sentence.supported ? "fact" : bad ? "bad" : "";
          const factSeg = transcript ? resolveSegment(transcript, sentence.evidenceSegmentIds[0]) : undefined;
          return (
            <div key={sentence.id} className={cn("emailline", cls, gone && "removed")}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{sentence.text}</div>
                {bad && !gone ? (
                  <>
                    <div className="sub" style={{ fontSize: 12, marginTop: 7, color: "var(--blocker)" }}>
                      {sentence.explanation}
                    </div>
                    <div className="hstack" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn sm play"
                    onClick={() => {
                      const ids = sentence.evidenceSegmentIds;
                      setFocus({ insightId: sentence.id, segmentIds: ids, play: true });
                      const seg = factSeg;
                      if (seg) void audio?.playRange(seg.startMs, seg.endMs);
                    }}
                      >
                        <PlayGlyph />
                        <span>Hear what they actually said</span>
                      </button>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => setRemoved((prev) => new Set(prev).add(sentence.id))}
                      >
                        Remove this sentence
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
              <div style={{ flex: "0 0 auto" }}>
                {sentence.kind === "factual" && sentence.supported && factSeg ? (
                  <button
                    type="button"
                    className="btn sm play"
                    onClick={() => {
                      setFocus({ insightId: sentence.id, segmentIds: sentence.evidenceSegmentIds, play: true });
                      void audio?.playRange(factSeg.startMs, factSeg.endMs);
                    }}
                  >
                    <PlayGlyph />
                    <span className="mono">{formatClock(factSeg.startMs)}</span>
                  </button>
                ) : bad && !gone ? (
                  <EvidenceStamp status="BLOCKER" />
                ) : gone ? (
                  <span className="chip">removed</span>
                ) : (
                  <span className="chip">not a claim</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="between" style={{ marginTop: 14 }}>
        <span className="tiny">
          {unsupportedLeft
            ? "The send button stays locked until the unsupported claim is gone."
            : "All clear — every factual sentence points to a segment."}
        </span>
        <div className="hstack">
          <button type="button" className="btn sm" onClick={() => mutation.mutate()}>
            Generate
          </button>
          <button type="button" className={unsupportedLeft ? "btn" : "btn primary"} disabled={unsupportedLeft > 0} onClick={copy}>
            {unsupportedLeft > 0 ? "🔒 Locked by the evidence gate" : "Copy the draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
