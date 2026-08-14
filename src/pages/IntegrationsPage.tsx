import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CrmSendDialog } from "@/features/integrations/CrmSendDialog";
import { proposeIntegrations } from "@/features/integrations/proposeActions";
import { getHubspotHealth } from "@/api/hubspot";
import { buildAcmeReport } from "@/mocks/fixtures/acmeReport";
import { ACME_CALL_ID, buildAcmeTranscript } from "@/mocks/fixtures/acmeTranscript";
import { EvidenceFocusProvider } from "@/components/evidence/EvidenceFocusContext";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";

const SLACK_ALERTS = [
  ["Deal risk", "A supported blocker appeared."],
  ["Claim refused", "The evidence gate blocked something."],
  ["Dimension lost", "A dimension proven last call disappeared."],
  ["No next meeting", "The customer would not book."],
] as const;

const SLACK_WEBHOOK_PREFIX = "https://hooks.slack.com/";

export function IntegrationsPage() {
  const [crmOpen, setCrmOpen] = useState(false);
  const [slackUrl, setSlackUrl] = useState("");
  const [slackConfigured, setSlackConfigured] = useState(false);
  const [slackError, setSlackError] = useState<string | null>(null);
  const report = buildAcmeReport();
  const transcript = buildAcmeTranscript();
  const proposed = proposeIntegrations(report);
  const health = useQuery({
    queryKey: ["hubspot-health"],
    queryFn: getHubspotHealth,
    retry: false,
  });
  const serviceOk = health.data?.status === "ok";

  function saveSlackWebhook() {
    const value = slackUrl.trim();
    if (!value.startsWith(SLACK_WEBHOOK_PREFIX) || value.length <= SLACK_WEBHOOK_PREFIX.length) {
      setSlackError("Webhook must be an https://hooks.slack.com/ URL.");
      return;
    }
    setSlackUrl("");
    setSlackError(null);
    setSlackConfigured(true);
  }

  return (
    <EvidenceFocusProvider>
      <AudioPlayerProvider>
        <div className="page mid">
          <div className="vstack" style={{ gap: 16 }}>
            <div className="card pad-lg reveal">
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Integrations
              </div>
              <h1 className="serif" style={{ fontSize: 33, letterSpacing: "-.02em", maxWidth: "24ch" }}>
                Nothing reaches your CRM without a receipt.
              </h1>
              <p className="sub" style={{ marginTop: 9, maxWidth: "62ch" }}>
                Deal Truth turns verified conversation intelligence into CRM records and team alerts. The same gate that
                blocks an unproven claim from the report blocks it from your pipeline.
              </p>
              <div className="hstack" style={{ marginTop: 14, flexWrap: "wrap" }}>
                <span className={`chip ${serviceOk ? "proof" : health.isError ? "unproven" : ""}`}>
                  <span className="dot" />
                  {serviceOk
                    ? "Integration service · operational"
                    : health.isError
                      ? "Integration service · unreachable"
                      : "Integration service · checking"}
                </span>
                <span className="chip">credentials never touch the browser</span>
              </div>
            </div>

            <div className="split">
              <div className="card pad-lg reveal" style={{ borderColor: "var(--proof-line)" }}>
                <div className="between" style={{ marginBottom: 8 }}>
                  <span className="eyebrow" style={{ color: "var(--proof)" }}>
                    CRM & deal management
                  </span>
                  <span className="chip proof">✓ Connected</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.01em", marginBottom: 3 }}>HubSpot</div>
                <div className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>
                  Deals, notes, tasks and logged activity — each field written only when a transcript segment supports it.
                </div>
                <div className="vstack" style={{ gap: 7 }}>
                  {proposed.crmActions.map((action) => {
                    const blocked = action.state === "BLOCKED";
                    const manual = action.state === "MANUAL";
                    return (
                      <div key={action.id} className="hstack" style={{ alignItems: "flex-start", gap: 8 }}>
                        <span style={{ color: blocked ? "var(--blocker)" : manual ? "var(--unproven)" : "var(--proof)", marginTop: 2 }}>
                          {blocked ? "✕" : manual ? "○" : "✓"}
                        </span>
                        <span>
                          <span className="hstack" style={{ gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 12.5 }}>{action.label}</span>
                            <span className={`chip ${blocked ? "blocker" : manual ? "unproven" : "proof"}`}>
                              {blocked ? "blocked" : manual ? "needs you" : "proven"}
                            </span>
                          </span>
                          <span className="tiny" style={{ display: "block" }}>
                            {action.reason}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button type="button" className="btn primary" style={{ marginTop: 14 }} onClick={() => setCrmOpen(true)}>
                  Send this call's intelligence
                </button>
              </div>

              <div className="card pad-lg reveal" style={{ borderColor: slackConfigured ? "var(--proof-line)" : "var(--unproven-line)" }}>
                <div className="between" style={{ marginBottom: 8 }}>
                  <span className="eyebrow" style={{ color: slackConfigured ? "var(--proof)" : "var(--unproven)" }}>
                    Team alerts
                  </span>
                  <span className={`chip ${slackConfigured ? "proof" : "unproven"}`}>
                    {slackConfigured ? "✓ Connected" : "○ Not configured"}
                  </span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.01em", marginBottom: 3 }}>Slack</div>
                <div className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>
                  Deal changes, risks and refused claims, delivered with the evidence attached.
                </div>
                <div className="vstack" style={{ gap: 7 }}>
                  {SLACK_ALERTS.map(([t, d]) => (
                    <div key={t} className="hstack" style={{ alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: slackConfigured ? "var(--proof)" : "var(--text-3)", marginTop: 2 }}>✓</span>
                      <span>
                        <span className="hstack" style={{ gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12.5 }}>{t}</span>
                          <span className={`chip ${slackConfigured ? "proof" : ""}`}>{slackConfigured ? "armed" : "off"}</span>
                        </span>
                        <span className="tiny" style={{ display: "block" }}>
                          {d}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="hstack" style={{ marginTop: 12 }}>
                  <input
                    className="inp"
                    type="url"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="https://hooks.slack.com/…"
                    value={slackUrl}
                    aria-label="Slack webhook URL"
                    onChange={(e) => setSlackUrl(e.target.value)}
                  />
                  <button type="button" className="btn sm" onClick={saveSlackWebhook}>
                    Save
                  </button>
                </div>
                {slackError ? <p className="tiny" style={{ marginTop: 8, color: "var(--blocker)" }}>{slackError}</p> : null}
                <div className="tiny" style={{ marginTop: 12, color: "var(--unproven)" }}>
                  The webhook is stored on the integration service. This app never keeps it in the browser, and never sends it with HubSpot requests.
                </div>
              </div>
            </div>

            <div className="card pad-lg reveal">
              <div className="h-sec" style={{ marginBottom: 4 }}>
                Why this is different from every other CRM sync
              </div>
              <div className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>
                Conversation tools write whatever the model produced. We write what the customer said, and we refuse the rest — visibly.
              </div>
              <div className="split3">
                <div className="card pad" style={{ boxShadow: "none" }}>
                  <div className="big-num" style={{ fontSize: 36, color: "var(--proof)" }}>
                    {proposed.crmActions.filter((action) => action.state === "SUPPORTED").length}
                  </div>
                  <div style={{ fontWeight: 700 }}>Written</div>
                  <div className="tiny">actions carry a segment</div>
                </div>
                <div className="card pad" style={{ boxShadow: "none" }}>
                  <div className="big-num" style={{ fontSize: 36, color: "var(--unproven)" }}>
                    {proposed.crmActions.filter((action) => action.state === "MANUAL").length}
                  </div>
                  <div style={{ fontWeight: 700 }}>Left to you</div>
                  <div className="tiny">not knowable from a call</div>
                </div>
                <div className="card pad" style={{ boxShadow: "none" }}>
                  <div className="big-num" style={{ fontSize: 36, color: "var(--blocker)" }}>
                    {proposed.crmActions.filter((action) => action.state === "BLOCKED").length}
                  </div>
                  <div style={{ fontWeight: 700 }}>Refused</div>
                  <div className="tiny">blocked, with the reason</div>
                </div>
              </div>
            </div>
          </div>
          <CrmSendDialog
            open={crmOpen}
            onClose={() => setCrmOpen(false)}
            report={report}
            transcript={transcript}
            callId={ACME_CALL_ID}
          />
        </div>
      </AudioPlayerProvider>
    </EvidenceFocusProvider>
  );
}
