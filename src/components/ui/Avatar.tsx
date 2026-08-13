import { cn } from "@/lib/utils";

export function Avatar({
  name,
  tone = "neutral",
  size = "md",
}: {
  name: string;
  tone?: "seller" | "customer" | "neutral";
  size?: "sm" | "md";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs",
        tone === "seller" && "bg-violet-100 text-violet-800",
        tone === "customer" && "bg-emerald-100 text-emerald-800",
        tone === "neutral" && "bg-ink-100 text-ink-700",
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
