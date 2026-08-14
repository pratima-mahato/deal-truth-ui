import { hubspotCapabilityLabels, interpretIntegrationHealth, CONNECTION_STATE } from "@/api/hubspot";
import {
  HUBSPOT_LOGO_URL,
  IntegrationConnectionCard,
  SLACK_LOGO_URL,
} from "@/features/integrations/IntegrationConnectionCard";
import { useAppIntegrations, useIntegrationHealth } from "@/hooks/useIntegrations";

const SLACK_CAPABILITIES = ["Deal risk", "Claim refused", "Dimension lost", "No next meeting"] as const;

export function IntegrationsPage() {
  const health = useIntegrationHealth();
  const slackStatus = useAppIntegrations();
  const connections = interpretIntegrationHealth(health.data);
  const hubspotConnected = connections.hubspot === CONNECTION_STATE.CONNECTED;
  const slackConnected = slackStatus.data?.configured === true || connections.slack === CONNECTION_STATE.CONNECTED;
  const hubspotCaps = hubspotCapabilityLabels(health.data?.operations);

  return (
    <div className="page mid">
      <div className="vstack" style={{ gap: 16 }}>
        <header className="card pad-lg reveal">
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Integrations
          </div>
          <h1 className="serif" style={{ fontSize: 33, letterSpacing: "-.02em", maxWidth: "24ch" }}>
            Nothing reaches your CRM without a receipt.
          </h1>
          <p className="sub" style={{ marginTop: 9, maxWidth: "62ch" }}>
            HubSpot writes only evidenced fields. Slack is configured on the Deal Truth API — credentials never touch this browser.
          </p>
          <div className="hstack" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <span className={`chip ${hubspotConnected || slackConnected ? "proof" : ""}`}>
              <span className="int-pulse" />
              {health.isLoading ? "Checking…" : hubspotConnected ? "HubSpot connected" : "HubSpot unreachable"}
            </span>
            <span className={`chip ${slackConnected ? "proof" : ""}`}>
              {slackStatus.isLoading ? "Checking Slack…" : slackConnected ? "Slack configured" : "Slack not configured"}
            </span>
            <span className="chip">credentials never touch the browser</span>
          </div>
        </header>

        <div className="split">
          <IntegrationConnectionCard
            name="HubSpot"
            eyebrow="CRM & deal management"
            description="Deals, notes, tasks and logged activity — each field written only when a transcript segment supports it."
            logoUrl={HUBSPOT_LOGO_URL}
            capabilities={hubspotCaps}
            connected={hubspotConnected}
          />
          <IntegrationConnectionCard
            name="Slack"
            eyebrow="Team alerts"
            description="Deal risks, refused claims and lost dimensions, delivered with the evidence attached."
            logoUrl={SLACK_LOGO_URL}
            capabilities={[...SLACK_CAPABILITIES]}
            connected={slackConnected}
          />
        </div>

        <p className="invariant" style={{ maxWidth: "58ch" }}>
          The same gate that blocks an unproven claim from the report blocks it from your pipeline.
        </p>
      </div>
    </div>
  );
}
