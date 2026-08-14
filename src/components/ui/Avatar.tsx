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
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold")}
      style={{
        width: size === "sm" ? 28 : 32,
        height: size === "sm" ? 28 : 32,
        fontSize: 11,
        background: tone === "seller" ? "var(--brand-soft)" : tone === "customer" ? "var(--proof-soft)" : "var(--surface-3)",
        color: tone === "seller" ? "var(--brand)" : tone === "customer" ? "var(--proof)" : "var(--text-2)",
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
