import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSearch } from "@/hooks/useCallApi";
import { ApiError } from "@/api/errors";
import type { SearchResult } from "@/api/contracts";
import { formatClock, highlightText } from "@/lib/utils";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { PlayGlyph, ArrowGlyph } from "@/components/brand/ChakraMark";

const SUGGESTIONS = [
  "no next step",
  "security",
  "pricing",
  "competitor",
  "commitment",
  "budget",
];

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightText(text, query).map((part, i) =>
        part.hit ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
      )}
    </>
  );
}

function InsightRow({ item, query }: { item: SearchResult; query: string }) {
  const segment = item.evidence?.segmentIds[0];
  const to =
    segment != null ? `/calls/${item.callId}/verdict?segment=${segment}&play=1` : `/calls/${item.callId}/verdict`;
  return (
    <Link to={to} className="receipt">
      <div className="receipt-head">
        <EvidenceStamp status="SUPPORTED" />
        <span className="chip">{item.callTitle}</span>
        {item.insightType ? <span className="chip brand">{item.insightType.replace("_", " ")}</span> : null}
        <span className="grow" />
        <span className="receipt-src mono">{item.startMs != null ? formatClock(item.startMs) : ""}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>
        <Marked text={item.title} query={query} />
      </div>
      <div className="sub" style={{ fontSize: 12.5 }}>
        <Marked text={item.snippet} query={query} />
      </div>
    </Link>
  );
}

function SegmentReceipt({ item, query }: { item: SearchResult; query: string }) {
  const segment = item.evidence?.segmentIds[0];
  const to =
    segment != null ? `/calls/${item.callId}/verdict?segment=${segment}&play=1` : `/calls/${item.callId}/verdict`;
  const hasAudio = Boolean(segment);
  return (
    <div className="receipt">
      <div className="receipt-head">
        <EvidenceStamp status="SUPPORTED" />
        <span className="chip">{item.callTitle}</span>
        <span className="grow" />
        <span className="receipt-src mono">{item.startMs != null ? formatClock(item.startMs) : ""}</span>
      </div>
      <div className="receipt-q">
        “<Marked text={item.snippet} query={query} />”
      </div>
      <div className="receipt-meta">
        {hasAudio ? (
          <Link to={to} className="btn sm play">
            <PlayGlyph />
            <span>audio available</span>
          </Link>
        ) : (
          <>
            <span className="chip absent">transcript only</span>
            <Link to={to} className="btn sm ghost">
              Open call <ArrowGlyph />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function groupByCall(items: SearchResult[]): Array<{ callTitle: string; items: SearchResult[] }> {
  const map = new Map<string, SearchResult[]>();
  for (const item of items) {
    const current = map.get(item.callTitle) ?? [];
    current.push(item);
    map.set(item.callTitle, current);
  }
  return [...map.entries()].map(([callTitle, grouped]) => ({ callTitle, items: grouped }));
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const search = useSearch(q);
  const unavailable = search.isError && search.error instanceof ApiError && search.error.status === 404;

  return (
    <div className="page mid">
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        Search every call
      </div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-.02em", marginBottom: 4 }}>
        Find the moment, not the document.
      </h1>
      <p className="sub" style={{ marginBottom: 16 }}>
        Every result is a segment someone actually said.
      </p>
      <input
        className="inp big"
        value={q}
        autoFocus
        placeholder="Try: security, no next step, pricing, competitor…"
        aria-label="Search query"
        onChange={(e) => setParams({ q: e.target.value })}
      />
      <div className="hstack" style={{ flexWrap: "wrap", margin: "12px 0 18px" }}>
        {SUGGESTIONS.map((item) => (
          <button key={item} type="button" className="chip" style={{ height: 28, cursor: "pointer" }} onClick={() => setParams({ q: item })}>
            {item}
          </button>
        ))}
      </div>
      {!q ? (
        <EmptyState title="Type a word from a call" description="Results are moments somebody said, not document links." />
      ) : search.isLoading ? (
        <PageSkeleton />
      ) : unavailable ? (
        <EmptyState
          title="Search is not available on this API yet"
          description="GET /api/v1/search is not implemented. The UI will not invent results."
        />
      ) : search.isError ? (
        <ErrorState title="Search failed" description={search.error instanceof Error ? search.error.message : "Try again."} onRetry={() => void search.refetch()} />
      ) : search.data && search.data.total === 0 ? (
        <div className="receipt absent">
          <div className="sub" style={{ fontSize: 13.5 }}>
            Nothing in any transcript matches “{q}”. We return no result rather than a loose one.
          </div>
        </div>
      ) : search.data ? (
        <div className="vstack" style={{ gap: 16 }}>
          <div className="tiny">
            {search.data.total} results across calls · {search.data.groups.segments.length} spoken moments · {search.data.groups.insights.length} validated insights
          </div>
          {search.data.groups.insights.length ? (
            <section className="vstack" style={{ gap: 10 }}>
              <div className="h-sec">Validated insights</div>
              {search.data.groups.insights.map((item) => (
                <InsightRow key={item.id} item={item} query={q} />
              ))}
            </section>
          ) : null}
          {search.data.groups.segments.length ? (
            <section className="vstack" style={{ gap: 14 }}>
              <div className="h-sec">Spoken moments</div>
              {groupByCall(search.data.groups.segments).map((group) => (
                <div key={group.callTitle} className="vstack" style={{ gap: 10 }}>
                  <div className="eyebrow">{group.callTitle}</div>
                  {group.items.map((item) => (
                    <SegmentReceipt key={item.id} item={item} query={q} />
                  ))}
                </div>
              ))}
            </section>
          ) : null}
          {search.data.groups.calls.length ? (
            <section className="vstack" style={{ gap: 8 }}>
              <div className="h-sec">Matching calls</div>
              {search.data.groups.calls.map((item) => (
                <Link key={item.id} to={`/calls/${item.callId}/verdict`} className="between" style={{ padding: "8px 0" }}>
                  <span>
                    <span style={{ fontWeight: 700 }}>{item.title}</span>
                    <span className="tiny" style={{ marginLeft: 8 }}>{item.snippet}</span>
                  </span>
                  <ArrowGlyph />
                </Link>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
