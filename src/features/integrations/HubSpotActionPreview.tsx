import type { ReactNode } from "react";
import type { IntegrationDraft } from "./buildOperations";
import { ACTION_LABELS } from "./buildOperations";
import { formatDuration } from "@/lib/utils";

function Block({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-ink-100 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">{kicker}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{title}</p>
      <div className="mt-1 space-y-0.5 text-sm text-ink-500">{children}</div>
    </article>
  );
}

export function HubSpotActionPreview({ draft }: { draft: IntegrationDraft }) {
  const selected = Object.entries(draft.selected).filter(([, on]) => on);
  if (selected.length === 0) {
    return <p className="text-sm text-ink-500">Select at least one CRM action to preview the payload.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">Preview what will be sent</p>
      {draft.selected.deal ? (
        <Block kicker="Deal" title={draft.deal.name || "Untitled deal"}>
          <p>{draft.deal.amount ? `$${draft.deal.amount.toLocaleString()}` : "Amount not set"}</p>
          <p>
            Pipeline: {draft.deal.pipeline || "—"} · Stage: {draft.deal.stage || "—"}
          </p>
          <p>Expected close: {draft.deal.closeDate ? new Date(draft.deal.closeDate).toLocaleDateString() : "—"}</p>
        </Block>
      ) : null}
      {draft.selected.note ? (
        <Block kicker="Note" title="Call summary">
          <p className="line-clamp-4">{draft.note.body || "Empty note"}</p>
        </Block>
      ) : null}
      {draft.selected.task ? (
        <Block kicker="Task" title={draft.task.subject || "Untitled task"}>
          <p>
            {draft.task.priority ?? "MEDIUM"} · {draft.task.taskType} · due{" "}
            {draft.task.dueAt ? new Date(draft.task.dueAt).toLocaleDateString() : "—"}
          </p>
        </Block>
      ) : null}
      {draft.selected.call ? (
        <Block kicker="Call" title={draft.call.title || "Untitled call"}>
          <p>{formatDuration(draft.call.durationMs)}</p>
        </Block>
      ) : null}
      {draft.selected.meeting ? (
        <Block kicker="Meeting" title={draft.meeting.title || "Untitled meeting"}>
          <p>{draft.meeting.timestamp ? new Date(draft.meeting.timestamp).toLocaleString() : "—"}</p>
        </Block>
      ) : null}
      <p className="text-xs text-ink-400">
        {selected.map(([key]) => ACTION_LABELS[key as keyof typeof ACTION_LABELS]).join(" · ")}
      </p>
    </div>
  );
}
