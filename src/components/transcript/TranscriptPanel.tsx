import { useEffect, useMemo, useRef, useState } from "react";
import type { Transcript } from "@/api/contracts";
import { cn, formatClock } from "@/lib/utils";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import type { Tone } from "@/features/workspace/overviewModel";
import { useAsk } from "@/hooks/useCallApi";
import { EvidenceReceipt } from "@/components/evidence/EvidenceReceipt";
import { resolveSegment } from "@/lib/evidence";

export function TranscriptPanel({
  transcript,
  annotations,
  callId,
}: {
  transcript: Transcript;
  readOnly?: boolean;
  annotations?: Map<string, { label: string; tone: Tone }[]>;
  callId?: string;
}) {
  const { focus, setFocus } = useEvidenceFocus();
  const { playFrom, currentMs, playing } = useAudioPlayer();
  const [query, setQuery] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState<"all" | "customer" | "seller">("all");
  const [askQ, setAskQ] = useState("");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const focused = useMemo(() => new Set(focus?.segmentIds ?? []), [focus]);
  const ask = useAsk(callId ?? "");

  useEffect(() => {
    const first = focus?.segmentIds[0];
    if (first == null) return;
    refs.current[first]?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (focus?.play) {
      const segs = transcript.segments.filter((s) => focus.segmentIds.includes(s.id));
      if (segs.length) {
        const start = Math.min(...segs.map((s) => s.startMs));
        void playFrom(start);
      }
    }
  }, [focus, playFrom, transcript.segments]);

  const activeByTime = transcript.segments.find((s) => currentMs >= s.startMs && currentMs <= s.endMs)?.id;

  const visible = transcript.segments.filter((segment) => {
    const speaker = transcript.speakers.find((s) => s.id === segment.speakerId);
    const speakerOk =
      speakerFilter === "all" ||
      speaker?.role === speakerFilter ||
      (speakerFilter === "customer" && speaker?.role === "customer") ||
      (speakerFilter === "seller" && speaker?.role === "seller");
    const queryOk = !query || segment.text.toLowerCase().includes(query.toLowerCase());
    return speakerOk && queryOk;
  });

  return (
    <div className="card" style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      <div className="between pad" style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", flex: "0 0 auto" }}>
        <span className="eyebrow">Transcript</span>
        <span className="tiny">{transcript.segments.length} segments · always live</span>
      </div>
      {callId ? (
        <div style={{ padding: "9px 12px", borderBottom: "1px solid var(--line)", flex: "0 0 auto" }}>
          <input
            className="inp"
            placeholder="Ask this call…  ⏎"
            value={askQ}
            onChange={(e) => setAskQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && askQ.trim()) {
                ask.mutate(askQ.trim());
                setAskQ("");
              }
            }}
          />
          {ask.data ? (
            <div style={{ marginTop: 8 }}>
              {ask.data.synthesis ? <p className="tiny" style={{ marginBottom: 6 }}>{ask.data.synthesis}</p> : null}
              <div className="vstack" style={{ gap: 6, maxHeight: 160, overflow: "auto" }}>
                {ask.data.moments.map((moment, index) => {
                  const segment = resolveSegment(transcript, moment.evidence.segmentIds[0]);
                  return segment ? (
                    <EvidenceReceipt key={`${moment.title}-${index}`} segment={segment} transcript={transcript} compact />
                  ) : (
                    <p key={`${moment.title}-${index}`} className="tiny">
                      {moment.title} — retrieved without a playable timestamp.
                    </p>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <input
          className="inp"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript…"
          aria-label="Search transcript"
        />
        <div className="hstack">
          {(["all", "customer", "seller"] as const).map((role) => (
            <button
              key={role}
              type="button"
              className={cn("chip", speakerFilter === role && "brand")}
              onClick={() => setSpeakerFilter(role)}
            >
              {role === "all" ? "All" : role === "customer" ? "Customer" : "Rep"}
            </button>
          ))}
        </div>
      </div>
      <div className="tx" style={{ flex: "1 1 auto", padding: "6px 8px" }}>
        {visible.map((segment) => {
          const speaker = transcript.speakers.find((s) => s.id === segment.speakerId);
          const active = focused.has(segment.id) || activeByTime === segment.id;
          const marks = annotations?.get(segment.id) ?? [];
          const inRange = playing && currentMs >= segment.startMs && currentMs <= segment.endMs;
          const pctDone =
            inRange && segment.endMs > segment.startMs
              ? Math.min(1, Math.max(0, (currentMs - segment.startMs) / (segment.endMs - segment.startMs)))
              : 0;
          const roleClass = speaker?.role === "customer" ? "customer" : speaker?.role === "seller" ? "seller" : "";
          return (
            <button
              key={segment.id}
              type="button"
              ref={(el) => {
                refs.current[segment.id] = el;
              }}
              className={cn("seg", active && "focus", focused.has(segment.id) && "pulse")}
              data-seg={segment.id}
              aria-current={active ? "true" : undefined}
              onClick={() => setFocus({ insightId: `seg-${segment.id}`, segmentIds: [segment.id], play: true })}
            >
              <div className="seg-t">{formatClock(segment.startMs)}</div>
              <div>
                <div className={cn("seg-who", roleClass)}>
                  {speaker?.displayName ?? segment.speakerId}
                  <span style={{ color: "var(--text-3)", fontWeight: 600 }}> · audio</span>
                </div>
                <div className="seg-x">
                  “
                  <span className="karaoke" style={{ ["--k" as string]: `${pctDone * 100}%` }}>
                    {query
                      ? segment.text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig")).map((part, i) =>
                          part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : part,
                        )
                      : segment.text}
                  </span>
                  ”
                </div>
                {marks.length ? (
                  <div className="seg-tags">
                    {marks.map((mark) => (
                      <span
                        key={mark.label}
                        className={cn("tag", mark.tone === "positive" ? "proof" : mark.tone === "danger" ? "blocker" : "unproven")}
                      >
                        {mark.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
