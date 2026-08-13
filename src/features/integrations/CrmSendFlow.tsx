import { useEffect, useMemo, useState } from "react";
import type { CallReport, Transcript } from "@/api/contracts";
import type { HubSpotOperation, HubSpotResponse, MockIntegrationScenario } from "@/api/integrations/contracts";
import { summarizeHubSpotResponse } from "@/api/integrations";
import { env } from "@/config/env";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useHubSpotExecution, useRetryFailedOperations } from "@/hooks/useIntegrations";
import {
  ACTION_LABELS,
  type ActionKind,
  type IntegrationDraft,
  SLACK_TYPE_OPTIONS,
  buildDraftFromIntelligence,
  composeOperations,
  requiredFieldErrors,
  saveIntegrationPrefs,
} from "./buildOperations";
import { ActionSelect } from "./ActionSelect";
import { HubSpotActionPreview } from "./HubSpotActionPreview";
import { SlackPreview } from "./SlackPreview";
import { ResultPanel } from "./ResultPanel";
import { useSlackUiState } from "./slackUiState";
import { cn } from "@/lib/utils";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : value;
}

export function CrmSendFlow({
  open,
  onClose,
  report,
  transcript,
  notifySlack = false,
}: {
  open: boolean;
  onClose: () => void;
  report?: CallReport;
  transcript?: Transcript;
  notifySlack?: boolean;
}) {
  const execute = useHubSpotExecution();
  const retry = useRetryFailedOperations();
  const slackUi = useSlackUiState();
  const [draft, setDraft] = useState<IntegrationDraft>(() => buildDraftFromIntelligence());
  const [errors, setErrors] = useState<string[]>([]);
  const [sentOps, setSentOps] = useState<HubSpotOperation[]>([]);
  const [response, setResponse] = useState<HubSpotResponse | null>(null);
  const [scenario, setScenario] = useState<MockIntegrationScenario>("success");
  const [includeSlack, setIncludeSlack] = useState(false);

  useEffect(() => {
    if (!open) return;
    const reportUrl = report ? `${window.location.origin}/calls/${report.call.id}/overview` : undefined;
    const next = buildDraftFromIntelligence(report, transcript, reportUrl);
    setDraft(next);
    setErrors([]);
    setResponse(null);
    setSentOps([]);
    setIncludeSlack(notifySlack && slackUi.demoConfigured);
  }, [open, report, transcript, notifySlack, slackUi.demoConfigured]);

  function persist(next: IntegrationDraft) {
    saveIntegrationPrefs({
      selected: next.selected,
      slackEnabled: next.slack.enabled,
      slackType: next.slack.type,
      slackSeverity: next.slack.severity,
    });
  }

  function patch(partial: Partial<IntegrationDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...partial };
      persist(next);
      return next;
    });
  }

  function toggleAction(kind: ActionKind) {
    setDraft((prev) => {
      const next = { ...prev, selected: { ...prev.selected, [kind]: !prev.selected[kind] } };
      persist(next);
      return next;
    });
  }

  const actions = useMemo(() => Object.keys(ACTION_LABELS) as ActionKind[], []);

  function send() {
    const issues = requiredFieldErrors(draft);
    setErrors(issues);
    if (issues.length) return;
    const operations = composeOperations(draft);
    setSentOps(operations);
    const slack = includeSlack
      ? {
          ...draft.slack,
          enabled: true,
          account: {
            ...draft.slack.account,
            ...(draft.deal.amount > 0 ? { amount: draft.deal.amount } : {}),
          },
        }
      : { ...draft.slack, enabled: false };
    execute.mutate(
      {
        operations,
        slack,
        scenario: env.useMockIntegrations ? scenario : undefined,
      },
      { onSuccess: (res) => setResponse(res) },
    );
  }

  function retryFailed() {
    if (!response) return;
    const failed = sentOps.filter((op) =>
      response.operations.some((row) => row.operationId === op.operationId && row.status === "FAILED"),
    );
    if (!failed.length) return;
    retry.mutate(
      { operations: failed },
      {
        onSuccess: (next) => {
          const kept = response.operations.filter((row) => row.status === "SUCCESS");
          const mergedOps = [...kept, ...next.operations];
          const summary = summarizeHubSpotResponse({ ...next, operations: mergedOps, slack: response.slack });
          setSentOps([...sentOps.filter((op) => !failed.includes(op)), ...failed]);
          setResponse({
            requestId: next.requestId,
            status: summary.overall,
            operations: mergedOps,
            slack: response.slack,
          });
        },
      },
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="Connected & Ready"
      title={report ? "Send intelligence" : "HubSpot"}
      footer={
        response ? (
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Done
          </Button>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={send} disabled={execute.isPending}>
              {execute.isPending ? "Sending to HubSpot…" : "Send to HubSpot"}
            </Button>
          </div>
        )
      }
    >
      {response ? (
        <ResultPanel
          response={response}
          originalOps={sentOps}
          onRetryFailed={retryFailed}
          retrying={retry.isPending}
        />
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-ink-500">
            {report
              ? "Choose HubSpot actions for this call. Credentials stay on the integration service."
              : "Open a finished call to prefill these actions from verified intelligence."}
          </p>

          {draft.omissions.length > 0 ? (
            <Alert tone="info" title="Mapped from this call">
              <ul className="list-disc space-y-1 pl-4 text-xs">
                {draft.omissions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">HubSpot actions</p>
            {actions.map((kind) => (
              <ActionSelect
                key={kind}
                kind={kind}
                selected={draft.selected[kind]}
                onToggle={() => toggleAction(kind)}
              />
            ))}
          </div>

          {draft.selected.deal ? (
            <div className="space-y-3">
              <Field label="Deal name" htmlFor="deal-name">
                <Input
                  id="deal-name"
                  value={draft.deal.name}
                  onChange={(e) => patch({ deal: { ...draft.deal, name: e.target.value } })}
                />
              </Field>
              <Field label="Amount" htmlFor="deal-amount">
                <Input
                  id="deal-amount"
                  type="number"
                  min={0}
                  value={draft.deal.amount}
                  onChange={(e) => patch({ deal: { ...draft.deal, amount: Number(e.target.value) } })}
                />
              </Field>
              <Field label="Pipeline" htmlFor="deal-pipeline">
                <Input
                  id="deal-pipeline"
                  value={draft.deal.pipeline}
                  onChange={(e) => patch({ deal: { ...draft.deal, pipeline: e.target.value } })}
                />
              </Field>
              <Field label="Stage" htmlFor="deal-stage">
                <Input
                  id="deal-stage"
                  value={draft.deal.stage}
                  onChange={(e) => patch({ deal: { ...draft.deal, stage: e.target.value } })}
                />
              </Field>
              <Field label="Close date" htmlFor="deal-close">
                <Input
                  id="deal-close"
                  type="datetime-local"
                  value={toLocalInput(draft.deal.closeDate)}
                  onChange={(e) => patch({ deal: { ...draft.deal, closeDate: fromLocalInput(e.target.value) } })}
                />
              </Field>
            </div>
          ) : null}

          {draft.selected.note ? (
            <Field label="Note" htmlFor="note-body">
              <Textarea
                id="note-body"
                className="min-h-[120px]"
                value={draft.note.body}
                onChange={(e) => patch({ note: { ...draft.note, body: e.target.value } })}
              />
            </Field>
          ) : null}

          {draft.selected.task ? (
            <div className="space-y-3">
              <Field label="Task subject" htmlFor="task-subject">
                <Input
                  id="task-subject"
                  value={draft.task.subject}
                  onChange={(e) => patch({ task: { ...draft.task, subject: e.target.value } })}
                />
              </Field>
              <Field label="Due" htmlFor="task-due">
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={toLocalInput(draft.task.dueAt)}
                  onChange={(e) => patch({ task: { ...draft.task, dueAt: fromLocalInput(e.target.value) } })}
                />
              </Field>
              <Field label="Type" htmlFor="task-type">
                <Select
                  id="task-type"
                  value={draft.task.taskType}
                  onChange={(e) =>
                    patch({ task: { ...draft.task, taskType: e.target.value as IntegrationDraft["task"]["taskType"] } })
                  }
                >
                  <option value="TODO">To-do</option>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                </Select>
              </Field>
              <Field label="Priority" htmlFor="task-priority">
                <Select
                  id="task-priority"
                  value={draft.task.priority ?? "MEDIUM"}
                  onChange={(e) =>
                    patch({
                      task: { ...draft.task, priority: e.target.value as IntegrationDraft["task"]["priority"] },
                    })
                  }
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </Select>
              </Field>
              <Field label="Task body" htmlFor="task-body">
                <Textarea
                  id="task-body"
                  value={draft.task.body ?? ""}
                  onChange={(e) => patch({ task: { ...draft.task, body: e.target.value } })}
                />
              </Field>
            </div>
          ) : null}

          {draft.selected.call ? (
            <div className="space-y-3">
              <Field label="Call title" htmlFor="call-title">
                <Input
                  id="call-title"
                  value={draft.call.title}
                  onChange={(e) => patch({ call: { ...draft.call, title: e.target.value } })}
                />
              </Field>
              <Field label="Duration (ms)" htmlFor="call-duration">
                <Input
                  id="call-duration"
                  type="number"
                  min={0}
                  value={draft.call.durationMs}
                  onChange={(e) => patch({ call: { ...draft.call, durationMs: Number(e.target.value) } })}
                />
              </Field>
              <Field label="Call body" htmlFor="call-body">
                <Textarea
                  id="call-body"
                  value={draft.call.body}
                  onChange={(e) => patch({ call: { ...draft.call, body: e.target.value } })}
                />
              </Field>
            </div>
          ) : null}

          {draft.selected.meeting ? (
            <div className="space-y-3">
              <Field label="Meeting title" htmlFor="meeting-title">
                <Input
                  id="meeting-title"
                  value={draft.meeting.title}
                  onChange={(e) => patch({ meeting: { ...draft.meeting, title: e.target.value } })}
                />
              </Field>
              <Field label="When" htmlFor="meeting-at">
                <Input
                  id="meeting-at"
                  type="datetime-local"
                  value={toLocalInput(draft.meeting.timestamp)}
                  onChange={(e) => patch({ meeting: { ...draft.meeting, timestamp: fromLocalInput(e.target.value) } })}
                />
              </Field>
              <Field label="Meeting body" htmlFor="meeting-body">
                <Textarea
                  id="meeting-body"
                  value={draft.meeting.body}
                  onChange={(e) => patch({ meeting: { ...draft.meeting, body: e.target.value } })}
                />
              </Field>
            </div>
          ) : null}

          <HubSpotActionPreview draft={draft} />

          <div className="rounded-xl border border-ink-100 bg-paper px-4 py-4">
            <button
              type="button"
              role="checkbox"
              aria-checked={includeSlack}
              onClick={() => setIncludeSlack((v) => !v)}
              className="flex w-full items-start gap-3 text-left"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold",
                  includeSlack ? "border-violet-600 bg-violet-600 text-white" : "border-ink-200 bg-white text-transparent",
                )}
                aria-hidden
              >
                ✓
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-900">Also notify Slack</span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  {slackUi.demoConfigured
                    ? "Demo mode will simulate delivery. The webhook stays on the mock server."
                    : "Uses the server-side Slack webhook. DealTruth cannot confirm that webhook from this app, and never sends the URL."}
                </span>
              </span>
            </button>

            {includeSlack ? (
              <div className="mt-4 space-y-3">
                <Field label="Notification type" htmlFor="send-slack-type">
                  <Select
                    id="send-slack-type"
                    value={draft.slack.type}
                    onChange={(e) => patch({ slack: { ...draft.slack, type: e.target.value } })}
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
                        aria-checked={draft.slack.severity === id}
                        onClick={() => patch({ slack: { ...draft.slack, severity: id } })}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                          draft.slack.severity === id
                            ? "border-violet-300 bg-violet-50 text-ink-900"
                            : "border-ink-100 bg-white text-ink-600",
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", swatch)} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <SlackPreview alert={{ ...draft.slack, enabled: true }} />
              </div>
            ) : null}
          </div>

          {env.useMockIntegrations ? (
            <Field label="Demo scenario" htmlFor="mock-scenario">
              <Select
                id="mock-scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as MockIntegrationScenario)}
              >
                <option value="success">All succeed</option>
                <option value="partial">Task fails (partial)</option>
                <option value="fail">All fail</option>
                <option value="slack-fail">CRM succeeds, Slack fails</option>
              </Select>
            </Field>
          ) : null}

          {errors.length ? (
            <Alert tone="danger" title="Fix these before sending">
              <ul className="list-disc pl-4">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </Alert>
          ) : null}

          {execute.isError ? (
            <Alert tone="danger" title="Unable to complete integration">
              {execute.error instanceof Error ? execute.error.message : "Try again."}
            </Alert>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
