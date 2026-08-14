import type { ReactNode } from "react";

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title: string;
  children?: ReactNode;
}) {
  const tones = {
    info: "brand",
    warning: "unproven",
    danger: "blocker",
    success: "proof",
  } as const;
  const t = tones[tone];
  return (
    <div
      className="card pad"
      style={{ borderColor: `var(--${t}-line)`, background: `var(--${t}-soft)` }}
      role="status"
    >
      <p style={{ fontWeight: 700 }}>{title}</p>
      {children ? <div className="sub" style={{ marginTop: 4 }}>{children}</div> : null}
    </div>
  );
}
