import { cn } from "@/lib/utils";
import type { CallStatus, EvidenceStatus, Severity } from "@/api/contracts";

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: string;
  tone?: "neutral" | "proof" | "unproven" | "blocker" | "absent" | "brand";
  className?: string;
}) {
  return <span className={cn("chip", tone === "neutral" ? undefined : tone, className)}>{children}</span>;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info" | "violet";
  className?: string;
}) {
  const mapped =
    tone === "positive" ? "proof" : tone === "warning" ? "unproven" : tone === "danger" ? "blocker" : tone === "violet" || tone === "info" ? "brand" : undefined;
  return (
    <span className={cn("chip", mapped, className)}>
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: CallStatus }) {
  const map: Record<CallStatus, { label: string; tone: "neutral" | "proof" | "unproven" | "blocker" | "brand" }> = {
    CREATED: { label: "Created", tone: "neutral" },
    UPLOADING: { label: "Uploading", tone: "brand" },
    QUEUED: { label: "Queued", tone: "brand" },
    TRANSCRIBING: { label: "Transcribing", tone: "brand" },
    WAITING_FOR_RECAP: { label: "Speakers", tone: "brand" },
    ANALYZING: { label: "Understanding", tone: "brand" },
    VALIDATING: { label: "Signals", tone: "brand" },
    INDEXING: { label: "Indexing", tone: "brand" },
    BUILDING_REPORT: { label: "Intelligence", tone: "brand" },
    SHIPPED: { label: "SHIPPED", tone: "proof" },
    PARTIAL: { label: "PARTIAL", tone: "unproven" },
    FAILED: { label: "FAILED", tone: "blocker" },
    CANCELLED: { label: "Cancelled", tone: "neutral" },
  };
  const item = map[status];
  return <Chip tone={item.tone}>{item.label}</Chip>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone = severity === "high" ? "blocker" : severity === "medium" ? "unproven" : "neutral";
  return <Chip tone={tone}>{severity}</Chip>;
}

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  if (status === "SUPPORTED") return <Chip tone="proof">PROVEN</Chip>;
  if (status === "ABSENCE_BASED") return <Chip tone="absent">NOT FOUND</Chip>;
  return <Chip tone="unproven">UNCONFIRMED</Chip>;
}
