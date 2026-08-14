import { useEffect, useMemo, useState } from "react";
import type { CallReport, Transcript } from "@/api/contracts";
import { slackIntegration, validateSlackWebhook } from "@/api/integrations";
import { env } from "@/config/env";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { SlackPreview } from "./SlackPreview";
import { SLACK_TYPE_OPTIONS, buildDraftFromIntelligence } from "./buildOperations";
import type { SlackAlert } from "@/api/integrations/contracts";
import { markDemoSlackConfigured } from "./slackUiState";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Connect" },
  { id: 2, label: "Configure" },
  { id: 3, label: "Preview" },
];

export function SlackSetupDrawer({
  open,
  onClose,
  report,
  transcript,
}: {
  open: boolean;
  onClose: () => void;
  report?: CallReport;
  transcript?: Transcript;
}) {
  const [step, setStep] = useState(1);
  const [webhook, setWebhook] = useState("");
  const [showWebhook, setShowWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveTone, setSaveTone] = useState<"info" | "warning">("info");
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<Record<string, boolean>>({
    DEAL_RISK: true,
    CRM_UPDATED: true,
    FOLLOW_UP_CREATED: true,
    CALL_PROCESSED: false,
    GENERAL: false,
  });
  const [alert, setAlert] = useState<SlackAlert>(() => ({
    enabled: true,
    type: "DEAL_RISK",
    severity: "critical",
    title: "Deal risk detected",
    message: "",
  }));

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setWebhook("");
    setShowWebhook(false);
    setWebhookError(null);
    setSaveMessage(null);
    const reportUrl = report ? `${window.location.origin}/calls/${report.call.id}/overview` : undefined;
    const draft = buildDraftFromIntelligence(report, transcript, reportUrl);
    setAlert({
      ...draft.slack,
      enabled: true,
      type: "DEAL_RISK",
      severity: draft.slack.severity || "critical",
      title: "Deal risk detected",
    });
  }, [open, report, transcript]);

  const selectedType = useMemo(
    () => Object.entries(types).find(([, on]) => on)?.[0] ?? "DEAL_RISK",
    [types],
  );

  const preview: SlackAlert = {
    ...alert,
    enabled: true,
    type: selectedType,
    title: alert.title || SLACK_TYPE_OPTIONS.find((opt) => opt.apiType === selectedType)?.label || "Deal risk detected",
  };

  async function save() {
    setWebhookError(null);
    setSaveMessage(null);
    const invalid = validateSlackWebhook(webhook);
    if (invalid) {
      setWebhookError(invalid);
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      const result = await slackIntegration.saveWebhook(webhook);
      setWebhook("");
      setShowWebhook(false);
      if (result.status === "demo") {
        markDemoSlackConfigured();
        setSaveTone("warning");
        setSaveMessage("Demo mode: Slack alerts are simulated. The webhook was not stored or sent anywhere.");
      } else {
        setSaveTone("info");
        setSaveMessage("Webhook saved on the Deal Truth API. The URL is stored server-side and is never returned.");
      }
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : "Could not save webhook.");
      setStep(1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      dirty={webhook.length > 0 && !saveMessage}
      eyebrow="Team alerts"
      title="Connect Slack"
      footer={
        saveMessage ? (
          <Button onClick={onClose} className="w-full sm:w-auto">
            Done
          </Button>
        ) : (
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="secondary" onClick={() => (step > 1 ? setStep(step - 1) : onClose())}>
              {step > 1 ? "Back" : "Cancel"}
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (step === 1) {
                    const invalid = validateSlackWebhook(webhook);
                    if (invalid) {
                      setWebhookError(invalid);
                      return;
                    }
                    setWebhookError(null);
                  }
                  setStep(step + 1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save configuration"}
              </Button>
            )}
          </div>
        )
      }
    >
      <ol className="mb-5 flex gap-2 text-xs font-medium">
        {STEPS.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex-1 rounded-full px-2 py-1 text-center",
              step === item.id
                ? "bg-violet-600 text-white"
                : step > item.id
                  ? "bg-violet-100 text-violet-800"
                  : "bg-ink-50 text-ink-400",
            )}
          >
            {item.id} {item.label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            Add a Slack incoming webhook. DealTruth never sends this value with HubSpot requests, and it is not stored in
            the browser.
          </p>
          <Field label="Slack webhook URL" htmlFor="slack-webhook">
            <div className="relative">
              <Input
                id="slack-webhook"
                type={showWebhook ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/…"
                className="pr-10"
                aria-invalid={Boolean(webhookError)}
                aria-describedby="slack-webhook-help"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                onClick={() => setShowWebhook((v) => !v)}
                aria-label={showWebhook ? "Hide webhook URL" : "Show webhook URL"}
              >
                {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <p id="slack-webhook-help" className="text-xs text-ink-400">
            Your webhook is used to deliver DealTruth alerts to Slack.
          </p>
          {webhookError ? (
            <Alert tone="danger" title="Check the webhook URL">
              {webhookError}
            </Alert>
          ) : null}
          {!env.useMockIntegrations ? (
            <Alert tone="info" title="Server configuration required">
              The current integration API has no webhook-save endpoint. Saving confirms the UI is ready, but Slack stays
              not connected until the backend stores the webhook.
            </Alert>
          ) : (
            <Alert tone="warning" title="Demo mode">
              Mock integrations can simulate Slack setup. This is not a verified backend connection.
            </Alert>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink-900">Notification types</p>
          <div className="space-y-2">
            {SLACK_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.apiType}
                type="button"
                role="checkbox"
                aria-checked={Boolean(types[opt.apiType])}
                onClick={() => setTypes((prev) => ({ ...prev, [opt.apiType]: !prev[opt.apiType] }))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm",
                  types[opt.apiType] ? "border-violet-200 bg-violet-50" : "border-ink-100 bg-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold",
                    types[opt.apiType]
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-ink-200 text-transparent",
                  )}
                  aria-hidden
                >
                  ✓
                </span>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-ink-900">Severity</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Severity">
            {(
              [
                ["critical", "Critical", "bg-red-600"],
                ["warning", "Warning", "bg-amber-500"],
                ["success", "Success", "bg-emerald-600"],
                ["info", "Info", "bg-sky-600"],
              ] as const
            ).map(([id, label, swatch]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={alert.severity === id}
                onClick={() => setAlert((prev) => ({ ...prev, severity: id }))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                  alert.severity === id ? "border-violet-300 bg-violet-50" : "border-ink-100 bg-white",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", swatch)} />
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <SlackPreview alert={preview} />
          {saveMessage ? (
            <Alert tone={saveTone} title="Configuration status">
              {saveMessage}
            </Alert>
          ) : null}
          <Field label="Title" htmlFor="slack-preview-title">
            <Input
              id="slack-preview-title"
              value={alert.title}
              onChange={(e) => setAlert((prev) => ({ ...prev, title: e.target.value }))}
            />
          </Field>
          <Field label="Message" htmlFor="slack-preview-message">
            <Textarea
              id="slack-preview-message"
              value={alert.message ?? ""}
              onChange={(e) => setAlert((prev) => ({ ...prev, message: e.target.value }))}
            />
          </Field>
        </div>
      ) : null}
    </Drawer>
  );
}
