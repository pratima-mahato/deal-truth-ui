import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSearch } from "@/hooks/useCallApi";
import { ApiError } from "@/api/errors";
import type { SearchResult } from "@/api/contracts";
import { formatClock } from "@/lib/utils";

const SUGGESTIONS = [
  "pricing objections",
  "Customers asking about integrations",
  "High intent calls this week",
  "No next step",
  "Competitor mentions",
];

function ResultList({ title, items }: { title: string; items: SearchResult[] }) {
  if (!items.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => {
          const segment = item.evidence?.segmentIds[0];
          const to =
            segment != null
              ? `/calls/${item.callId}/transcript?segment=${segment}&play=1`
              : `/calls/${item.callId}/overview`;
          return (
            <li key={item.id}>
              <Link
                to={to}
                className="block rounded-xl border border-ink-100 bg-surface px-5 py-4 transition hover:border-violet-200 hover:shadow-card"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">“{item.snippet}”</p>
                    <p className="mt-2 text-xs text-ink-400">
                      {item.callTitle}
                      {item.startMs != null ? ` · ${formatClock(item.startMs)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    {item.insightType ? <Badge tone="violet">{item.insightType.replace("_", " ")}</Badge> : null}
                    {segment != null ? (
                      <Button size="sm" variant="secondary">
                        Open evidence
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const search = useSearch(q);

  const unavailable =
    search.isError && search.error instanceof ApiError && search.error.status === 404;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Search</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">Ask across every conversation</h1>
      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setParams({ q: String(data.get("q") ?? "") });
        }}
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search conversations, insights, objections..."
          aria-label="Search query"
          className="h-12 text-base"
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-ink-100 bg-white px-3 py-1 text-xs text-ink-600 hover:border-violet-200 hover:text-violet-700"
            onClick={() => setParams({ q: item })}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {!q ? (
          <EmptyState
            title="Search like a research engine"
            description="Try pricing objections, integrations, or deals with no next step."
          />
        ) : search.isLoading ? (
          <PageSkeleton />
        ) : unavailable ? (
          <EmptyState
            title="Search is not available on this API yet"
            description="Prompt 2 has no /search endpoint. This page falls back to client-side search over shipped calls; that lookup also failed."
          />
        ) : search.isError ? (
          <ErrorState
            title="Search failed"
            description={search.error instanceof Error ? search.error.message : "Try again."}
            onRetry={() => void search.refetch()}
          />
        ) : search.data && search.data.total === 0 ? (
          <EmptyState title="No matches" description={`Nothing in shipped calls matched “${q}”.`} />
        ) : search.data ? (
          <>
            <ResultList title="Insights" items={search.data.groups.insights} />
            <ResultList title="Transcript" items={search.data.groups.segments} />
            <ResultList title="Calls" items={search.data.groups.calls} />
          </>
        ) : null}
      </div>
    </div>
  );
}
