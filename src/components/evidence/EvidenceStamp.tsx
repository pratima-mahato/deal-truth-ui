import { cn } from "@/lib/utils";
import { stampLabel, stampTone, type StampStatus } from "@/lib/evidence";

export function EvidenceStamp({
  status,
  animate = true,
  className,
}: {
  status: StampStatus;
  animate?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("stamp", stampTone(status), animate && "anim", className)}>{stampLabel(status)}</span>
  );
}
