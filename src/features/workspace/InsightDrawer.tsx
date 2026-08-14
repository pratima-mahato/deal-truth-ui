import { Drawer } from "@/components/ui/Drawer";
import { formatClock } from "@/lib/utils";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { ArrowGlyph } from "@/components/brand/ChakraMark";
import { Chip } from "@/components/ui/Badge";

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
          <button
            type="button"
            className="btn primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => {
              setFocus({ ...focus, play: true });
              onJumpToTranscript();
            }}
          >
            Play it in the transcript <ArrowGlyph />
          </button>
        ) : null
      }
    >
      {drawer ? (
        <div className="vstack" style={{ gap: 14 }}>
          <div className="hstack" style={{ flexWrap: "wrap" }}>
            {drawer.severity ? (
              <Chip tone={drawer.severity === "high" ? "blocker" : "unproven"}>{drawer.severity}</Chip>
            ) : (
              <Chip tone="brand">{drawer.kind}</Chip>
            )}
            {drawer.evidenceStatus ? <Chip tone="proof">{drawer.evidenceStatus.replace("_", " ")}</Chip> : null}
          </div>
          <section>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Why this matters</div>
            <p className="sub">{drawer.why}</p>
          </section>
          {drawer.quote ? (
            <div className="receipt">
              <div className="receipt-src mono">
                {drawer.startMs != null ? formatClock(drawer.startMs) : "—"}
                {drawer.speakerName ? ` · ${drawer.speakerName}` : ""}
              </div>
              <div className="receipt-q">“{drawer.quote}”</div>
            </div>
          ) : (
            <p className="sub">No transcript quote is attached. This finding is absence-based.</p>
          )}
          {drawer.action ? (
            <section>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Recommended action</div>
              <p className="sub">{drawer.action}</p>
            </section>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
