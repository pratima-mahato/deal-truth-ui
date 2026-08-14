import type { Summary } from "@/api/contracts";
import type { DimensionTile } from "@/lib/evidence";
import { isSummaryUnavailable } from "./partialReport";

const ABSENT_COPY = "None stated on this call";

const COLUMNS: Array<{ key: "decisions" | "actionItems" | "nextSteps"; label: string }> = [
  { key: "decisions", label: "Decisions" },
  { key: "actionItems", label: "Action items" },
  { key: "nextSteps", label: "Next steps" },
];

export function CallSummarySection({
  summary,
  tiles,
  unavailable = [],
}: {
  summary: Summary;
  tiles: DimensionTile[];
  unavailable?: Iterable<string>;
}) {
  const degraded = isSummaryUnavailable(unavailable);
  const headline = summary.headline.trim();
  const tldr = summary.tldr.trim();
  const detailed = summary.detailed.trim();

  return (
    <div className="card pad-lg reveal">
      <div className="eyebrow" style={{ marginBottom: 9 }}>
        The verdict
      </div>
      {degraded || !headline ? (
        <div
          className="summary-col absent"
          style={{ marginBottom: 12 }}
        >
          <div className="eyebrow" style={{ color: "var(--unproven)" }}>
            Baseline recap
          </div>
          <p className="sub" style={{ marginTop: 8 }}>
            Baseline summary unavailable — extraction and evidence are unaffected.
          </p>
        </div>
      ) : (
        <>
          <div className="serif" style={{ fontSize: 27, lineHeight: 1.22, letterSpacing: "-.015em", maxWidth: "36ch" }}>
            {headline}
          </div>
          {tldr ? <p className="summary-dek" style={{ marginTop: 10 }}>{tldr}</p> : null}
        </>
      )}

      {tiles.length ? (
        <div className="hstack" style={{ marginTop: 14, flexWrap: "wrap" }}>
          {tiles.map((tile) => (
            <span
              key={tile.id}
              className={`chip ${tile.state === "proven" ? "proof" : tile.state === "missing" ? "absent" : "blocker"}`}
            >
              {tile.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="summary-cols" style={{ marginTop: 16 }}>
        {COLUMNS.map((column) => {
          const items = summary[column.key].map((item) => item.trim()).filter(Boolean);
          const empty = items.length === 0 || degraded;
          return (
            <section
              key={column.key}
              className={empty ? "summary-col absent" : "summary-col"}
              aria-label={column.label}
            >
              <div className="eyebrow">{column.label}</div>
              {empty ? (
                <p className="tiny" style={{ marginTop: 8 }}>
                  {ABSENT_COPY}
                </p>
              ) : (
                <ul>
                  {items.map((item, index) => (
                    <li key={`${column.key}-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {detailed && !degraded ? (
        <details className="summary-details">
          <summary>Detailed recap</summary>
          <p className="sub" style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            {detailed}
          </p>
        </details>
      ) : null}

      <p className="invariant" style={{ marginTop: 14 }}>
        Every line below can be played back in the customer's own voice. No close probability — only what was observed.
      </p>
    </div>
  );
}
