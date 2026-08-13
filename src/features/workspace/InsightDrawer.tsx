import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { formatClock } from "@/lib/utils";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";

export function InsightDrawer({
  onJumpToTranscript,
}: {
  onJumpToTranscript: () => void;
}) {
  const { focus, setFocus, clearFocus } = useEvidenceFocus();
  const drawer = focus?.drawer;
  const open = !!drawer;

  return (
    <Drawer
      open={open}
      eyebrow="Why we think this"
      title={drawer?.title ?? "Evidence"}
      onClose={clearFocus}
      footer={
        drawer && focus && focus.segmentIds.length > 0 ? (
          <Button
            className="w-full"
            onClick={() => {
              setFocus({ ...focus, play: true });
              onJumpToTranscript();
            }}
          >
            Jump to transcript
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null
      }
    >
      {drawer ? (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {drawer.severity ? (
              <Badge tone={drawer.severity === "high" ? "danger" : drawer.severity === "medium" ? "warning" : "neutral"}>
                {drawer.severity}
              </Badge>
            ) : (
              <Badge tone="violet">{drawer.kind}</Badge>
            )}
            {drawer.evidenceStatus ? <Badge tone="positive">{drawer.evidenceStatus.replace("_", " ")}</Badge> : null}
          </div>
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Why this matters</h3>
            <p className="mt-2 leading-relaxed text-ink-700">{drawer.why}</p>
          </section>
          {drawer.quote ? (
            <section className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">Evidence</h3>
              <p className="mt-2 font-mono text-xs text-ink-400">
                {drawer.startMs != null ? formatClock(drawer.startMs) : "—"}
                {drawer.speakerName ? ` · ${drawer.speakerName}` : ""}
              </p>
              <blockquote className="mt-2 text-[15px] leading-relaxed text-ink-900">“{drawer.quote}”</blockquote>
            </section>
          ) : (
            <p className="text-ink-500">No transcript quote is attached. This finding is absence-based.</p>
          )}
          {drawer.action ? (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Recommended action</h3>
              <p className="mt-2 leading-relaxed text-ink-700">{drawer.action}</p>
            </section>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
