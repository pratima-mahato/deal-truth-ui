import { Briefcase, FileText, ListTodo, Phone, Users } from "lucide-react";
import type { ActionKind } from "./buildOperations";
import { ACTION_COPY } from "./buildOperations";
import { cn } from "@/lib/utils";

const ICONS: Record<ActionKind, typeof Briefcase> = {
  deal: Briefcase,
  note: FileText,
  task: ListTodo,
  call: Phone,
  meeting: Users,
};

export function ActionSelect({
  kind,
  selected,
  onToggle,
}: {
  kind: ActionKind;
  selected: boolean;
  onToggle: () => void;
}) {
  const copy = ACTION_COPY[kind];
  const Icon = ICONS[kind];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
        selected ? "border-violet-200 bg-violet-50 shadow-card" : "border-ink-100 bg-white hover:border-violet-200",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold",
          selected ? "border-violet-600 bg-violet-600 text-white" : "border-ink-200 bg-white text-transparent",
        )}
        aria-hidden
      >
        ✓
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-900">{copy.title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{copy.description}</span>
      </span>
    </button>
  );
}
