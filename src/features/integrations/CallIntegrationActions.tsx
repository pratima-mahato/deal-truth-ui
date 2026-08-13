import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSlackUiState } from "./slackUiState";

export function CallIntegrationActions({
  onSendHubSpot,
  onConfigureSlack,
  onNotifySlack,
}: {
  onSendHubSpot: () => void;
  onConfigureSlack: () => void;
  onNotifySlack: () => void;
}) {
  const slack = useSlackUiState();

  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">CRM & team actions</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-900">HubSpot</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Connected
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">Turn this call into CRM actions.</p>
          <Button size="sm" className="mt-3" onClick={onSendHubSpot}>
            Send intelligence
          </Button>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-900">Slack</p>
            {slack.demoConfigured ? (
              <span className="text-xs font-semibold text-amber-800">Demo only</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-500">
                <Circle className="h-2.5 w-2.5" aria-hidden />
                Not configured
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {slack.demoConfigured
              ? "Simulated alerts in mock mode. Not a verified backend connection."
              : "Send important deal intelligence and risk alerts to your team."}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={slack.demoConfigured ? onNotifySlack : onConfigureSlack}
          >
            {slack.demoConfigured ? "Notify Slack" : "Configure Slack"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
