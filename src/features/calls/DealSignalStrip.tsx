import type { DealSignal } from "@/api/contracts";
import { cn } from "@/lib/utils";

export function DealSignalStrip({ signals }: { signals: DealSignal[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {signals.map((signal) => (
        <span
          key={signal.id}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            signal.state === "positive" && "border-teal-200 bg-teal-50 text-teal-900",
            signal.state === "negative" && "border-red-200 bg-red-50 text-red-900",
            signal.state === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
            signal.state === "missing" && "border-slate-200 bg-slate-50 text-slate-600",
          )}
        >
          <span aria-hidden>
            {signal.state === "positive" ? "●" : signal.state === "missing" ? "○" : "▲"}
          </span>
          {signal.label}
        </span>
      ))}
    </div>
  );
}
