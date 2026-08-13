import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Circle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IntegrationHealthPill } from "@/features/integrations/IntegrationHealthPill";
import { HubSpotManageDrawer } from "@/features/integrations/HubSpotManageDrawer";
import { SlackSetupDrawer } from "@/features/integrations/SlackSetupDrawer";
import { useSlackUiState } from "@/features/integrations/slackUiState";
import { cn } from "@/lib/utils";

const HUBSPOT_ACTIONS = [
  "Create deals",
  "Add notes",
  "Create follow-up tasks",
  "Log completed calls",
  "Log completed meetings",
];

const SLACK_ALERTS = [
  "Deal risk detected",
  "CRM updated",
  "Follow-up created",
  "Call processed",
  "General",
];

export function IntegrationsPage() {
  const [hubspotOpen, setHubspotOpen] = useState(false);
  const [slackOpen, setSlackOpen] = useState(false);
  const slack = useSlackUiState();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-surface to-paper px-5 py-8 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700">Integrations</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 text-balance sm:text-4xl">
          Connect your workflow
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-500">
          Turn verified conversation intelligence into CRM actions, and send important deal changes to your team.
        </p>
        <div className="mt-5">
          <IntegrationHealthPill />
        </div>
        <p className="mt-4 max-w-xl text-xs text-ink-400">
          HubSpot is already connected on the integration service. Slack alerts require a server-side webhook — this app
          never stores that value in the browser.
        </p>
      </section>

      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <Card className="flex h-full flex-col border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-surface p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                CRM & Deal Management
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-900">HubSpot</h2>
              <p className="mt-1 text-sm font-medium text-emerald-800">Connected & ready</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Connected
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            Turn verified conversation intelligence into CRM actions. DealTruth can now create deals, notes, tasks, and
            logged activity in HubSpot.
          </p>
          <ul className="mt-5 space-y-2">
            {HUBSPOT_ACTIONS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-6">
            <Button onClick={() => setHubspotOpen(true)}>
              Manage actions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card
          className={cn(
            "flex h-full flex-col p-6",
            slack.demoConfigured ? "border-amber-100 bg-gradient-to-b from-amber-50/60 to-surface" : "bg-surface",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Team alerts</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-900">Slack</h2>
              <p className="mt-1 text-sm font-medium text-ink-600">
                {slack.demoConfigured ? "Demo setup only" : "Not configured"}
              </p>
            </div>
            {slack.demoConfigured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                Demo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-600">
                <Circle className="h-2.5 w-2.5" aria-hidden />
                Needs setup
              </span>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            Send important deal changes, risks and evidence directly to Slack. Connect your team’s alerts, then choose
            what DealTruth should notify.
          </p>
          <ul className="mt-5 space-y-2">
            {SLACK_ALERTS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink-700">
                <Circle className="mt-1 h-3 w-3 shrink-0 text-ink-300" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          {slack.demoConfigured ? (
            <p className="mt-4 text-xs text-amber-800">
              Mock mode can simulate Slack setup. This is not a verified backend connection.
            </p>
          ) : (
            <p className="mt-4 text-xs text-ink-400">
              The current API has no webhook-save endpoint. Setup prepares the UI; the server must store the webhook.
            </p>
          )}
          <div className="mt-auto pt-6">
            <Button variant={slack.demoConfigured ? "secondary" : "primary"} onClick={() => setSlackOpen(true)}>
              {slack.demoConfigured ? "Review Slack setup" : "Connect Slack"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <p className="text-sm text-ink-500">
        The strongest path is from a finished call.{" "}
        <Link to="/" className="font-medium text-violet-700 hover:underline">
          Open workspace
        </Link>{" "}
        → review intelligence → Send intelligence.
      </p>

      <HubSpotManageDrawer open={hubspotOpen} onClose={() => setHubspotOpen(false)} />
      <SlackSetupDrawer open={slackOpen} onClose={() => setSlackOpen(false)} />
    </div>
  );
}
