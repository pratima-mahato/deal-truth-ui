import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-card transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
