import type { SlackAlert } from "@/api/integrations/contracts";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { SlackPreview } from "./SlackPreview";
import { SLACK_TYPE_OPTIONS } from "./buildOperations";
import { cn } from "@/lib/utils";

const SEVERITIES: { id: SlackAlert["severity"]; label: string; swatch: string }[] = [
  { id: "critical", label: "Critical", swatch: "bg-red-600" },
  { id: "warning", label: "Warning", swatch: "bg-amber-500" },
  { id: "success", label: "Success", swatch: "bg-emerald-600" },
  { id: "info", label: "Info", swatch: "bg-sky-600" },
];

export function SlackConfigPanel({
  alert,
  onChange,
}: {
  alert: SlackAlert;
  onChange: (next: SlackAlert) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">Slack alerts</p>
        <h3 className="mt-1 text-base font-semibold text-ink-900">Choose when DealTruth should notify your team.</h3>
        <p className="mt-1 text-sm text-ink-500">
          Notifications are sent by the integration service with the HubSpot request. Webhook credentials stay on the
          server.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-800">
        <input
          type="checkbox"
          checked={alert.enabled}
          onChange={(e) => onChange({ ...alert, enabled: e.target.checked })}
        />
        Include Slack notification
      </label>

      <Field label="Alert type" htmlFor="slack-type">
        <Select
          id="slack-type"
          value={alert.type}
          onChange={(e) => onChange({ ...alert, type: e.target.value })}
          disabled={!alert.enabled}
        >
          {SLACK_TYPE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.apiType}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-800">Severity</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Slack severity">
          {SEVERITIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={alert.severity === item.id}
              disabled={!alert.enabled}
              onClick={() => onChange({ ...alert, severity: item.id })}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                alert.severity === item.id
                  ? "border-violet-300 bg-violet-50 text-ink-900"
                  : "border-ink-100 bg-white text-ink-600 hover:border-violet-200",
                !alert.enabled && "opacity-50",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", item.swatch)} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Title" htmlFor="slack-title">
        <Input
          id="slack-title"
          value={alert.title}
          onChange={(e) => onChange({ ...alert, title: e.target.value })}
          disabled={!alert.enabled}
        />
      </Field>
      <Field label="Message" htmlFor="slack-message">
        <Textarea
          id="slack-message"
          value={alert.message ?? ""}
          onChange={(e) => onChange({ ...alert, message: e.target.value })}
          disabled={!alert.enabled}
        />
      </Field>

      <SlackPreview alert={alert} />
    </div>
  );
}
