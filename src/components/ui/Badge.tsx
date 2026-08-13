import { cn } from "@/lib/utils";
import type { CallStatus, EvidenceStatus, Severity } from "@/api/contracts";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info" | "violet";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-50 text-ink-700",
    positive: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-800",
    info: "bg-sky-50 text-sky-800",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: CallStatus }) {
  const map: Record<CallStatus, { label: string; tone: "neutral" | "positive" | "warning" | "danger" | "info" | "violet" }> = {
    CREATED: { label: "Created", tone: "neutral" },
    UPLOADING: { label: "Uploading", tone: "violet" },
    QUEUED: { label: "Queued", tone: "info" },
    TRANSCRIBING: { label: "Transcribing", tone: "violet" },
    WAITING_FOR_RECAP: { label: "Speakers", tone: "violet" },
    ANALYZING: { label: "Understanding", tone: "violet" },
    VALIDATING: { label: "Signals", tone: "violet" },
    INDEXING: { label: "Indexing", tone: "violet" },
    BUILDING_REPORT: { label: "Intelligence", tone: "violet" },
    SHIPPED: { label: "Ready", tone: "positive" },
    PARTIAL: { label: "Partial", tone: "warning" },
    FAILED: { label: "Failed", tone: "danger" },
    CANCELLED: { label: "Cancelled", tone: "neutral" },
  };
  const item = map[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone = severity === "high" ? "danger" : severity === "medium" ? "warning" : "neutral";
  return <Badge tone={tone}>{severity}</Badge>;
}

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  if (status === "SUPPORTED") return <Badge tone="positive">Supported</Badge>;
  if (status === "ABSENCE_BASED") return <Badge tone="warning">Absence-based</Badge>;
  return <Badge tone="warning">Unconfirmed</Badge>;
}
