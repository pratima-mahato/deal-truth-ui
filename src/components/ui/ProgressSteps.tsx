import { PROCESSING_STAGES, isTerminalStatus, type CallStatus } from "@/api/contracts";
import { cn } from "@/lib/utils";

export function ProgressSteps({ status }: { status: CallStatus }) {
  const current = PROCESSING_STAGES.findIndex((s) => s.status === status);
  return (
    <ol className="space-y-3">
      {PROCESSING_STAGES.map((stage, index) => {
        const done =
          isTerminalStatus(status) && status !== "FAILED"
            ? true
            : current > index;
        const active = stage.status === status;
        const failed = status === "FAILED" && active;
        return (
          <li key={stage.status} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                failed && "bg-red-700 text-white",
                done && !failed && "bg-teal-700 text-white",
                active && !failed && "bg-navy-900 text-white",
                !done && !active && "bg-slate-200 text-slate-500",
              )}
            >
              {done && !failed ? "✓" : index + 1}
            </span>
            <span className={cn("text-sm", active ? "font-semibold text-navy-900" : "text-slate-600")}>
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
