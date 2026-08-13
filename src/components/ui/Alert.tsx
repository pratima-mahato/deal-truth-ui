import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title: string;
  children?: ReactNode;
}) {
  const tones = {
    info: "border-violet-100 bg-violet-50 text-ink-900",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    danger: "border-red-200 bg-red-50 text-red-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone])} role="status">
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1 text-sm opacity-90">{children}</div> : null}
    </div>
  );
}
