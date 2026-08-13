import { useEffect, useMemo, useRef, useState } from "react";
import type { Speaker, Transcript } from "@/api/contracts";
import { cn, formatClock, highlightText, speakerName } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import type { Tone } from "@/features/workspace/overviewModel";

export function TranscriptPanel({
  transcript,
  annotations,
}: {
  transcript: Transcript;
  readOnly?: boolean;
  annotations?: Map<string, { label: string; tone: Tone }[]>;
}) {
  const { focus, setFocus } = useEvidenceFocus();
  const { playRange, currentMs } = useAudioPlayer();
  const [query, setQuery] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState<string>("all");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const focused = useMemo(() => new Set(focus?.segmentIds ?? []), [focus]);

  useEffect(() => {
    const first = focus?.segmentIds[0];
    if (first == null) return;
    refs.current[first]?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (focus?.play) {
      const segs = transcript.segments.filter((s) => focus.segmentIds.includes(s.id));
      if (segs.length) {
        const start = Math.min(...segs.map((s) => s.startMs));
        const end = Math.max(...segs.map((s) => s.endMs));
        void playRange(start, end);
      }
    }
  }, [focus, playRange, transcript.segments]);

  const activeByTime = transcript.segments.find((s) => currentMs >= s.startMs && currentMs <= s.endMs)?.id;

  const visible = transcript.segments.filter((segment) => {
    const speakerOk = speakerFilter === "all" || segment.speakerId === speakerFilter;
    const queryOk = !query || segment.text.toLowerCase().includes(query.toLowerCase());
    return speakerOk && queryOk;
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript..."
          aria-label="Search transcript"
        />
        <select
          className="rounded-lg border border-ink-100 bg-white px-2 text-sm"
          value={speakerFilter}
          onChange={(e) => setSpeakerFilter(e.target.value)}
          aria-label="Filter by speaker"
        >
          <option value="all">All speakers</option>
          {transcript.speakers.map((speaker) => (
            <option key={speaker.id} value={speaker.id}>
              {speaker.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {visible.map((segment) => {
          const active = focused.has(segment.id) || activeByTime === segment.id;
          const speaker = transcript.speakers.find((s) => s.id === segment.speakerId);
          const marks = annotations?.get(segment.id) ?? [];
          const parts = highlightText(segment.text, query);
          return (
            <button
              key={segment.id}
              type="button"
              ref={(el) => {
                refs.current[segment.id] = el;
              }}
              className={cn(
                "group flex w-full gap-3 rounded-xl px-3 py-3 text-left transition",
                active ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-white",
              )}
              onClick={() =>
                setFocus({
                  insightId: `seg-${segment.id}`,
                  segmentIds: [segment.id],
                  play: true,
                })
              }
            >
              <Avatar name={speakerName(transcript.speakers, segment.speakerId)} tone={roleTone(speaker)} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-ink-800">
                    {speakerName(transcript.speakers, segment.speakerId)}
                  </span>
                  <span className="font-mono text-ink-400">{formatClock(segment.startMs)}</span>
                  {marks.map((mark) => (
                    <Badge key={mark.label} tone={mark.tone === "positive" ? "positive" : mark.tone === "danger" ? "danger" : "warning"}>
                      {mark.label}
                    </Badge>
                  ))}
                </span>
                <span className="block text-[15px] leading-relaxed text-ink-800">
                  {parts.map((part, i) => (
                    <span key={`${segment.id}-${i}`} className={part.hit ? "rounded bg-amber-200 px-0.5" : undefined}>
                      {part.text}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function roleTone(speaker?: Speaker): "seller" | "customer" | "neutral" {
  if (speaker?.role === "seller") return "seller";
  if (speaker?.role === "customer") return "customer";
  return "neutral";
}
