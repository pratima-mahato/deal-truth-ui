import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Drawer({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className={open ? "scrim on" : "scrim"} onClick={onClose} />
      <aside className={open ? "drawer on" : "drawer"} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="between pad" style={{ borderBottom: "1px solid var(--line)" }}>
          <div>
            {eyebrow ? <p className="chip brand">{eyebrow}</p> : null}
            <h2 id="drawer-title" className="h-sec" style={{ marginTop: 6 }}>
              {title}
            </h2>
          </div>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="drawer-b">{children}</div>
        {footer ? <div className="pad" style={{ borderTop: "1px solid var(--line)" }}>{footer}</div> : null}
      </aside>
    </>
  );
}
