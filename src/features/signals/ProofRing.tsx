import type { DimensionTile } from "@/lib/evidence";

const CENTRE = 93;
const INNER = 52;
const OUTER = 86;

const COLOUR: Record<DimensionTile["state"], string> = {
  proven: "var(--proof)",
  blocked: "var(--blocker)",
  weak: "var(--unproven)",
  missing: "var(--absent-line)",
};

export function ProofRing({ tiles }: { tiles: DimensionTile[] }) {
  const spokes: Array<{ i: number; x1: string; y1: string; x2: string; y2: string; state: DimensionTile["state"] }> = [];
  tiles.forEach((tile, si) => {
    for (let k = 0; k < 3; k += 1) {
      const i = si * 3 + k;
      const a = ((i * 15 - 90) * Math.PI) / 180;
      spokes.push({
        i,
        x1: (CENTRE + INNER * Math.cos(a)).toFixed(2),
        y1: (CENTRE + INNER * Math.sin(a)).toFixed(2),
        x2: (CENTRE + OUTER * Math.cos(a)).toFixed(2),
        y2: (CENTRE + OUTER * Math.sin(a)).toFixed(2),
        state: tile.state,
      });
    }
  });
  const proven = tiles.filter((t) => t.state === "proven").length;
  const blocked = tiles.filter((t) => t.state === "blocked" || t.state === "weak").length;
  const missing = tiles.filter((t) => t.state === "missing").length;

  return (
    <div>
      <div className="ring-wrap">
        <svg viewBox="0 0 186 186" width="186" height="186">
          <circle cx={CENTRE} cy={CENTRE} r="90" fill="none" stroke="var(--line)" strokeWidth="1" />
          <circle cx={CENTRE} cy={CENTRE} r="47" fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />
          {spokes.map((spoke) => {
            const solid = spoke.state !== "missing";
            return (
              <line
                key={spoke.i}
                className="spoke"
                x1={spoke.x1}
                y1={spoke.y1}
                x2={spoke.x2}
                y2={spoke.y2}
                stroke={COLOUR[spoke.state]}
                strokeWidth={solid ? 3.4 : 2}
                strokeLinecap="round"
                strokeDasharray={solid ? undefined : "2.5 4"}
                style={{ animation: `spokeIn .5s ease ${(spoke.i * 0.028).toFixed(2)}s both` }}
              />
            );
          })}
        </svg>
        <div className="ring-center">
          <div className="ring-num">
            {proven}
            <span style={{ color: "var(--text-3)", fontSize: 24 }}>/8</span>
          </div>
          <div className="ring-lbl">
            dimensions
            <br />
            proven
          </div>
        </div>
      </div>
      <div className="ring-legend">
        <span>
          <i className="dot" style={{ color: "var(--proof)" }} />
          {proven} proven
        </span>
        <span>
          <i className="dot" style={{ color: "var(--blocker)" }} />
          {blocked} blocked
        </span>
        <span>
          <i className="dot" style={{ color: "var(--absent)" }} />
          {missing} not found
        </span>
      </div>
    </div>
  );
}

export function SignalBoard({
  tiles,
  onSelect,
}: {
  tiles: DimensionTile[];
  onSelect?: (tile: DimensionTile) => void;
}) {
  return (
    <div className="signals">
      {tiles.map((tile) => (
        <button key={tile.id} type="button" className={`sig ${tile.state}`} onClick={() => onSelect?.(tile)}>
          <div className="sig-l">{tile.label}</div>
          <div className="sig-v">{tile.value}</div>
        </button>
      ))}
    </div>
  );
}
