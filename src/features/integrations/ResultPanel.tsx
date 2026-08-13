import type { HubSpotOperation, HubSpotResponse } from "@/api/integrations/contracts";
import { summarizeHubSpotResponse } from "@/api/integrations";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { OPERATION_LABELS } from "./buildOperations";
import { ExternalLink } from "lucide-react";

export function ResultPanel({
  response,
  originalOps,
  onRetryFailed,
  retrying,
}: {
  response: HubSpotResponse;
  originalOps: HubSpotOperation[];
  onRetryFailed: () => void;
  retrying?: boolean;
}) {
  const summary = summarizeHubSpotResponse(response);
  const failedOps = originalOps.filter((op) =>
    response.operations.some((res) => res.operationId === op.operationId && res.status === "FAILED"),
  );

  const title =
    summary.overall === "SUCCESS"
      ? "CRM update complete"
      : summary.overall === "PARTIAL"
        ? `${summary.succeeded} of ${summary.total} HubSpot actions completed`
        : "Unable to complete integration";

  const tone = summary.overall === "SUCCESS" ? "success" : summary.overall === "PARTIAL" ? "warning" : "danger";

  return (
    <div className="space-y-4">
      <Alert tone={tone} title={title}>
        {summary.overall === "PARTIAL"
          ? "Each action is independent. Successful records were created and were not rolled back."
          : summary.overall === "FAILED"
            ? "No CRM records were created."
            : `${summary.succeeded} HubSpot ${summary.succeeded === 1 ? "action" : "actions"} completed.`}
      </Alert>

      <ul className="space-y-2">
        {response.operations.map((op) => {
          const label = (op.type && OPERATION_LABELS[op.type]) || op.type || "Action";
          return (
            <li key={op.operationId} className="rounded-xl border border-ink-100 bg-white px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {op.status === "SUCCESS" ? "✓" : "✕"} {label}
                  </p>
                  {op.externalId ? <p className="mt-0.5 text-xs text-ink-400">{op.externalId}</p> : null}
                  {op.status === "FAILED" ? (
                    <p className="mt-1 text-sm text-red-700">{op.error?.message ?? "Could not create this record."}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={op.status === "SUCCESS" ? "positive" : "danger"}>
                    {op.status === "SUCCESS" ? "Created" : "Failed"}
                  </Badge>
                  {op.entityUrl ? (
                    <a
                      href={op.entityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline"
                    >
                      Open in HubSpot
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {response.slack ? (
        <div className="rounded-xl border border-ink-100 bg-paper px-4 py-3">
          <p className="text-sm font-semibold text-ink-900">Slack</p>
          <p className="mt-1 text-sm text-ink-600">
            {response.slack.status === "SUCCESS" && "✓ Notification delivered"}
            {response.slack.status === "SKIPPED" && (response.slack.message ?? "Slack was skipped.")}
            {response.slack.status === "FAILED" &&
              (response.slack.message ?? "✕ Notification failed. CRM records were not rolled back.")}
          </p>
        </div>
      ) : null}

      {failedOps.length > 0 ? (
        <Button onClick={onRetryFailed} disabled={retrying}>
          {retrying ? "Retrying…" : "Retry failed action"}
        </Button>
      ) : null}
    </div>
  );
}
