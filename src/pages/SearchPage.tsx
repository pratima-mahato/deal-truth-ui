import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useSearch } from "@/hooks/useCallApi";
import { ApiError, userFacingMessage } from "@/api/errors";
import type { SearchResult } from "@/api/contracts";
import { cn, formatClock } from "@/lib/utils";

const SUGGESTIONS = [
  "pricing objections",
  "Customers asking about integrations",
  "High intent calls this week",
  "No next step",
  "Competitor mentions",
];

const openLinkClass =
  "inline-flex h-8 shrink-0 items-center rounded-lg border border-ink-100 bg-white px-3 text-sm font-medium text-ink-900 hover:border-violet-200 hover:bg-violet-50";

function resultHref(item: SearchResult): string {
  if (!item.callId) return "/search";
  const segment = item.kind === "segment" ? item.evidence?.segmentIds[0] : undefined;
  if (segment) return `/calls/${item.callId}/transcript?segment=${segment}&play=1`;
  return `/calls/${item.callId}/overview`;
}

function ResultList({ title, items, actionLabel }: { title: string; items: SearchResult[]; actionLabel: string }) {
  const visible = items.filter((item) => item.callId);
  if (!visible.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">{title}</h2>
      <ul className="space-y-2">
        {visible.map((item) => {
          const href = resultHref(item);
          const showQuote = item.snippet && item.snippet !== item.title;
          return (
            <li key={item.id}>
              <Link
                to={href}
                className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-surface px-5 py-4 transition hover:border-violet-200 hover:shadow-card sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  {showQuote ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">“{item.snippet}”</p>
                  ) : null}
                  <p className="mt-2 text-xs text-ink-400">
                    {item.callTitle !== item.title ? item.callTitle : "Call"}
                    {item.startMs != null ? ` · ${formatClock(item.startMs)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.insightType ? <Badge tone="violet">{item.insightType.replace("_", " ")}</Badge> : null}
                  <span className={openLinkClass}>{actionLabel}</span>
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
          key={q}
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
            className={cn(
              "rounded-full border px-3 py-1 text-xs hover:border-violet-200 hover:text-violet-700",
              q === item ? "border-violet-300 bg-violet-50 text-violet-800" : "border-ink-100 bg-white text-ink-600",
            )}
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
            description={userFacingMessage(search.error, "Could not load search results. Try a different query.")}
            onRetry={() => void search.refetch()}
          />
        ) : search.data && search.data.total === 0 ? (
          <EmptyState title="No matches" description={`Nothing in shipped calls matched “${q}”.`} />
        ) : search.data ? (
          <>
            <ResultList title="Calls" items={search.data.groups.calls} actionLabel="Open" />
            <ResultList title="Transcript" items={search.data.groups.segments} actionLabel="Open evidence" />
            <ResultList title="Insights" items={search.data.groups.insights} actionLabel="Open" />
          </>
        ) : null}
      </div>
    </div>
  );
}
