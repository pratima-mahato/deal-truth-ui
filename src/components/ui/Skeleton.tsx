import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(className)}
      style={{
        borderRadius: 8,
        background: "var(--surface-3)",
        minHeight: 16,
      }}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full" />
      <div className="split3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
