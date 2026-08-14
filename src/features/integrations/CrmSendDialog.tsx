import type { CallReport, Transcript } from "@/api/contracts";
import { isApiError } from "@/api/client";
import { executeHubspotSync } from "@/api/hubspot/client";
import type { HubspotOperation, HubspotSyncResponse } from "@/api/hubspot/types";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import { useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { formatClock } from "@/lib/utils";
import { resolveSegment } from "@/lib/evidence";
import { useEffect, useMemo, useState } from "react";
import {
  buildDealOperation,
  DEAL_DEFAULTS,
  proposeIntegrations,
  type ProposedCrmAction,
} from "./proposeActions";

function reportUrlFor(callId: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/calls/${callId}`;
}

function actionTone(state: ProposedCrmAction["state"]): "proof" | "blocker" | "unproven" {
  if (state === "SUPPORTED") return "proof";
  if (state === "BLOCKED") return "blocker";
  return "unproven";
}

export function CrmSendDialog({
  open,
  onClose,
  report,
  transcript,
  callId,
}: {
  open: boolean;
  onClose: () => void;
  report: CallReport;
  transcript: Transcript;
  callId: string;
}) {
  const proposed = useMemo(
    () => proposeIntegrations(report, { reportUrl: reportUrlFor(callId), transcript }),
    [report, transcript, callId],
  );
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  const [dealName, setDealName] = useState(proposed.dealName);
  const [pipeline, setPipeline] = useState<string>(DEAL_DEFAULTS.pipeline);
  const [stage, setStage] = useState<string>(DEAL_DEFAULTS.stage);
  const [amount, setAmount] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HubspotSyncResponse | null>(null);
  const { setFocus } = useEvidenceFocus();

  useEffect(() => {
    if (!open) return;
    setSkipped(new Set(proposed.crmActions.filter((action) => !action.defaultSelected).map((action) => action.id)));
    setDealName(proposed.dealName);
    setPipeline(DEAL_DEFAULTS.pipeline);
    setStage(DEAL_DEFAULTS.stage);
    setAmount("");
    setCloseDate("");
    setSubmitting(false);
    setError(null);
    setResult(null);
  }, [open, proposed]);

  if (!open) return null;

  const dealOperation = buildDealOperation({
    name: dealName,
    pipeline,
    stage,
    amount: Number(amount),
    closeDate,
  });

  function isSkipped(id: string): boolean {
    return skipped.has(id);
  }

  function toggleSkip(id: string) {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedOperations: HubspotOperation[] = [];
  for (const action of proposed.crmActions) {
    if (action.state === "BLOCKED" || isSkipped(action.id)) continue;
    if (action.type === "CREATE_DEAL") {
      if (dealOperation) selectedOperations.push(dealOperation);
      continue;
    }
    if (action.operation) selectedOperations.push(action.operation);
  }

  const slackSelected = !isSkipped(proposed.slack.id);
  const supportedCount = proposed.crmActions.filter((action) => action.state === "SUPPORTED" && !isSkipped(action.id)).length;
  const manualCount = proposed.crmActions.filter((action) => action.state === "MANUAL").length;
  const blockedCount = proposed.crmActions.filter((action) => action.state === "BLOCKED").length;
  const canSubmit = selectedOperations.length > 0 && !submitting;

  async function onApprove() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await executeHubspotSync({
        operations: selectedOperations,
        slack: slackSelected ? proposed.slack.slack : undefined,
      });
      setResult(response);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not reach the integration service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="scrim on" onClick={onClose}>
      <div
        id="crmModal"
        className="modal on"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(760px, 94vw)" }}
      >
        <div className="between pad" style={{ borderBottom: "1px solid var(--line)" }}>
          <span className="hstack">
            <span className="chip brand">Send to HubSpot</span>
            <span className="tiny">approve each action before it is written</span>
          </span>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="pad" style={{ overflow: "auto" }}>
          {result ? (
            <SyncResultPanel result={result} onClose={onClose} />
          ) : (
            <>
              <div className="hstack" style={{ flexWrap: "wrap", marginBottom: 14 }}>
                <span className="chip proof">{supportedCount} actions with evidence</span>
                <span className="chip unproven">{manualCount} need you</span>
                <span className="chip blocker">{blockedCount} refused</span>
                {slackSelected ? <span className="chip proof">Slack armed</span> : <span className="chip unproven">Slack skipped</span>}
              </div>
              <div className="vstack" style={{ gap: 8 }}>
                {proposed.crmActions.map((action) => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    transcript={transcript}
                    skipped={isSkipped(action.id)}
                    onToggle={() => toggleSkip(action.id)}
                    onPlay={(segmentId) => setFocus({ insightId: action.id, segmentIds: [segmentId], play: true })}
                    deal={{
                      name: dealName,
                      pipeline,
                      stage,
                      amount,
                      closeDate,
                      ready: Boolean(dealOperation),
                      onName: setDealName,
                      onPipeline: setPipeline,
                      onStage: setStage,
                      onAmount: setAmount,
                      onCloseDate: setCloseDate,
                    }}
                  />
                ))}
                <SlackRow
                  label={proposed.slack.label}
                  value={proposed.slack.value}
                  reason={proposed.slack.reason}
                  skipped={isSkipped(proposed.slack.id)}
                  onToggle={() => toggleSkip(proposed.slack.id)}
                />
              </div>
              {error ? <p className="tiny" style={{ color: "var(--blocker)", marginTop: 12 }}>{error}</p> : null}
            </>
          )}
        </div>
        {result ? null : (
          <div className="between pad" style={{ borderTop: "1px solid var(--line)" }}>
            <span className="tiny">
              Blocked actions cannot be overridden from here. Credentials stay on the integration service — this request never includes a HubSpot token or Slack webhook.
            </span>
            <button type="button" className="btn primary" disabled={!canSubmit} onClick={() => void onApprove()}>
              {submitting ? "Sending…" : `Approve and send ${selectedOperations.length} HubSpot action${selectedOperations.length === 1 ? "" : "s"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionRow({
  action,
  transcript,
  skipped,
  onToggle,
  onPlay,
  deal,
}: {
  action: ProposedCrmAction;
  transcript: Transcript;
  skipped: boolean;
  onToggle: () => void;
  onPlay: (segmentId: string) => void;
  deal: {
    name: string;
    pipeline: string;
    stage: string;
    amount: string;
    closeDate: string;
    ready: boolean;
    onName: (value: string) => void;
    onPipeline: (value: string) => void;
    onStage: (value: string) => void;
    onAmount: (value: string) => void;
    onCloseDate: (value: string) => void;
  };
}) {
  const tone = actionTone(action.state);
  const segment = action.segmentId ? resolveSegment(transcript, action.segmentId) : undefined;
  return (
    <div
      className="card pad"
      style={{ borderColor: `var(--${tone}-line)`, background: `var(--${tone}-soft)`, opacity: skipped ? 0.45 : 1 }}
    >
      <div className="between" style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{action.label}</span>
        {action.state === "SUPPORTED" ? <EvidenceStamp status="SUPPORTED" /> : null}
        {action.state === "BLOCKED" ? <EvidenceStamp status="BLOCKER" /> : null}
        {action.state === "MANUAL" ? <span className="chip unproven">you must enter this</span> : null}
      </div>
      {action.value ? (
        <div style={{ fontSize: 13, marginBottom: 6, whiteSpace: "pre-wrap" }}>{action.value}</div>
      ) : null}
      <div className="tiny">{action.reason}</div>
      {action.state === "MANUAL" && action.type === "CREATE_DEAL" && !skipped ? (
        <DealFields deal={deal} />
      ) : null}
      <div className="hstack" style={{ marginTop: 8 }}>
        {segment ? (
          <button type="button" className="btn sm play" onClick={() => onPlay(segment.id)}>
            <PlayGlyph />
            <span className="mono">{formatClock(segment.startMs)}</span>
          </button>
        ) : null}
        {action.state === "SUPPORTED" ? (
          <button type="button" className="btn sm ghost" onClick={onToggle}>
            {skipped ? "Include" : "Skip"}
          </button>
        ) : null}
        {action.state === "MANUAL" ? (
          <button type="button" className="btn sm ghost" onClick={onToggle}>
            {skipped ? "Include" : "Skip"}
          </button>
        ) : null}
        {action.state === "BLOCKED" ? (
          <button type="button" className="btn sm" disabled>
            Log completed meeting
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DealFields({
  deal,
}: {
  deal: {
    name: string;
    pipeline: string;
    stage: string;
    amount: string;
    closeDate: string;
    ready: boolean;
    onName: (value: string) => void;
    onPipeline: (value: string) => void;
    onStage: (value: string) => void;
    onAmount: (value: string) => void;
    onCloseDate: (value: string) => void;
  };
}) {
  return (
    <div className="vstack" style={{ gap: 8, marginTop: 10 }}>
      <label className="tiny">
        Deal name
        <input className="inp" value={deal.name} onChange={(e) => deal.onName(e.target.value)} autoComplete="off" />
      </label>
      <div className="split">
        <label className="tiny">
          Pipeline id
          <input className="inp" value={deal.pipeline} onChange={(e) => deal.onPipeline(e.target.value)} autoComplete="off" />
        </label>
        <label className="tiny">
          Stage id
          <input className="inp" value={deal.stage} onChange={(e) => deal.onStage(e.target.value)} autoComplete="off" />
        </label>
      </div>
      <div className="split">
        <label className="tiny">
          Amount
          <input
            className="inp"
            type="number"
            min={0}
            step="1"
            value={deal.amount}
            onChange={(e) => deal.onAmount(e.target.value)}
            placeholder="Not stated on the call"
            autoComplete="off"
          />
        </label>
        <label className="tiny">
          Close date
          <input className="inp" type="date" value={deal.closeDate} onChange={(e) => deal.onCloseDate(e.target.value)} />
        </label>
      </div>
      <div className="tiny">{deal.ready ? "Deal will be included in this send." : "Fill amount and close date to include a deal. Pipeline and stage must match your HubSpot portal."}</div>
    </div>
  );
}

function SlackRow({
  label,
  value,
  reason,
  skipped,
  onToggle,
}: {
  label: string;
  value: string;
  reason: string;
  skipped: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="card pad"
      style={{ borderColor: "var(--proof-line)", background: "var(--proof-soft)", opacity: skipped ? 0.45 : 1 }}
    >
      <div className="between" style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{label}</span>
        <span className="chip proof">✓ Connected</span>
      </div>
      <div style={{ fontSize: 13, marginBottom: 6 }}>{value}</div>
      <div className="tiny">{reason}</div>
      <div className="hstack" style={{ marginTop: 8 }}>
        <button type="button" className="btn sm ghost" onClick={onToggle}>
          {skipped ? "Include Slack" : "Skip Slack"}
        </button>
      </div>
    </div>
  );
}

function SyncResultPanel({ result, onClose }: { result: HubspotSyncResponse; onClose: () => void }) {
  const tone = result.status === "SUCCESS" ? "proof" : result.status === "PARTIAL" ? "unproven" : "blocker";
  return (
    <div className="vstack" style={{ gap: 10 }}>
      <div className={`chip ${tone}`}>HubSpot {result.status.toLowerCase()}</div>
      {result.operations.map((operation) => (
        <div key={operation.operationId} className="card pad" style={{ boxShadow: "none" }}>
          <div className="between">
            <span style={{ fontWeight: 700, fontSize: 13 }}>{operation.type.replace("CREATE_", "").toLowerCase()}</span>
            <span className={`chip ${operation.status === "SUCCESS" ? "proof" : "blocker"}`}>{operation.status}</span>
          </div>
          {operation.entityUrl ? (
            <a href={operation.entityUrl} target="_blank" rel="noreferrer" className="tiny" style={{ color: "var(--brand)", fontWeight: 700 }}>
              Open in HubSpot
            </a>
          ) : null}
          {operation.errorCode ? <div className="tiny">{operation.errorCode}</div> : null}
        </div>
      ))}
      <div className="card pad" style={{ boxShadow: "none" }}>
        <div className="between">
          <span style={{ fontWeight: 700, fontSize: 13 }}>Slack</span>
          <span className={`chip ${result.slack.status === "SUCCESS" ? "proof" : result.slack.status === "SKIPPED" ? "unproven" : "blocker"}`}>
            {result.slack.status}
          </span>
        </div>
        {result.slack.errorCode ? <div className="tiny">{result.slack.errorCode}</div> : null}
      </div>
      <button type="button" className="btn primary" onClick={onClose}>
        Done
      </button>
    </div>
  );
}
