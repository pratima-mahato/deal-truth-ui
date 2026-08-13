import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-ink-100 via-violet-50 to-ink-100 bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
