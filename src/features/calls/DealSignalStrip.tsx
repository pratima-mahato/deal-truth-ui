import type { DimensionState } from "@/lib/evidence";
import { DEAL_DIMENSIONS, deriveDimensions, pipsFromCallBadges } from "@/lib/evidence";
import type { Call, CallReport, DealSignal } from "@/api/contracts";

export function ProofPips({ states }: { states: DimensionState[] }) {
  if (!states.length) return <span className="tiny">—</span>;
  return (
    <div className="pips">
      {states.map((state, i) => (
        <i key={`${state}-${i}`} className={`pip ${state}`} />
      ))}
    </div>
  );
}

export function DealSignalStrip({ signals, report }: { signals: DealSignal[]; report?: CallReport }) {
  const tiles = report
    ? deriveDimensions(report)
    : signals.map((signal) => ({
        id: signal.id,
        label: signal.label,
        state:
          signal.state === "positive"
            ? ("proven" as const)
            : signal.state === "missing"
              ? ("missing" as const)
              : signal.state === "warning"
                ? ("weak" as const)
                : ("blocked" as const),
        value:
          signal.state === "positive" ? "PROVEN" : signal.state === "missing" ? "NOT FOUND" : "ACTIVE",
        why: signal.label,
        segmentIds: [] as string[],
      }));

  return (
    <div className="signals">
      {tiles.map((tile) => (
        <div key={tile.id} className={`sig ${tile.state}`}>
          <div className="sig-l">{tile.label}</div>
          <div className="sig-v">{tile.value}</div>
        </div>
      ))}
    </div>
  );
}

export function callPips(call: Call): DimensionState[] {
  if (call.signalPips && call.signalPips.length === DEAL_DIMENSIONS.length) {
    return call.signalPips;
  }
  return pipsFromCallBadges(call.signalBadges, call.biggestRisk);
}
