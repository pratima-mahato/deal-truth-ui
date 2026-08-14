import { useEffect } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
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
    <div className="scrim on" onClick={onClose}>
      <div className="modal on" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="between pad" style={{ borderBottom: "1px solid var(--line)" }}>
          <h2 id="modal-title" className="h-sec">
            {title}
          </h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="pad">{children}</div>
        {footer ? <div className="pad" style={{ borderTop: "1px solid var(--line)" }}>{footer}</div> : null}
      </div>
    </div>
  );
}
