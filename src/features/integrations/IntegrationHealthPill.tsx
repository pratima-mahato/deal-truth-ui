import { Button } from "@/components/ui/Button";
import { useIntegrationHealth } from "@/hooks/useIntegrations";
import { cn } from "@/lib/utils";

export function IntegrationHealthPill() {
  const health = useIntegrationHealth();
  const ok = health.isSuccess && Boolean(health.data?.status);
  const label = health.isLoading
    ? "Checking integration service…"
    : ok
      ? "Integration service · Operational"
      : "Integration service unavailable";

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs text-ink-600">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          health.isLoading && "animate-pulse bg-violet-400",
          ok && "animate-pulse bg-emerald-500",
          !ok && !health.isLoading && "bg-red-500",
        )}
        aria-hidden
      />
      <span className="font-medium text-ink-800">{label}</span>
      {!ok && !health.isLoading ? (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => void health.refetch()}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
