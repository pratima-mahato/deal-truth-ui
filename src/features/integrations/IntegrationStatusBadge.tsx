import { Badge } from "@/components/ui/Badge";

export type IntegrationStatus =
  | "connected"
  | "available"
  | "configured"
  | "active"
  | "not_configured"
  | "needs_setup"
  | "demo"
  | "unavailable";

const MAP: Record<IntegrationStatus, { label: string; tone: "neutral" | "positive" | "warning" | "danger" | "info" | "violet" }> = {
  connected: { label: "Connected & Ready", tone: "positive" },
  available: { label: "Available", tone: "violet" },
  configured: { label: "Configured on server", tone: "positive" },
  active: { label: "Active", tone: "positive" },
  not_configured: { label: "Not configured", tone: "neutral" },
  needs_setup: { label: "Needs setup", tone: "warning" },
  demo: { label: "Demo only", tone: "warning" },
  unavailable: { label: "Unavailable", tone: "danger" },
};

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const item = MAP[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
