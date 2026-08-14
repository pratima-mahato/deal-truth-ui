import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card pad-lg" style={{ textAlign: "center", borderStyle: "dashed" }}>
      <h2 className="h-sec">{title}</h2>
      <p className="sub" style={{ marginTop: 8 }}>{description}</p>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="page narrow">
      <div className="card pad-lg" style={{ textAlign: "center", borderColor: "var(--blocker-line)", background: "var(--blocker-soft)" }}>
        <h2 className="h-sec" style={{ color: "var(--blocker)" }}>{title}</h2>
        <p className="sub" style={{ marginTop: 8 }}>{description}</p>
        {onRetry ? (
          <button type="button" className="btn" style={{ marginTop: 14 }} onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
