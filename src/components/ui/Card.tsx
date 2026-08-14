import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="between pad" style={{ borderBottom: "1px solid var(--line)" }}>
      <div>
        <h2 className="h-sec">{title}</h2>
        {description ? <p className="sub" style={{ marginTop: 4 }}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
