import { X } from "lucide-react";
import { useCallback, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DrawerSize = "md" | "lg";

const DEFAULT_DRAWER_SIZE: DrawerSize = "md";
const UNSAVED_CLOSE_PROMPT = "You have unsaved changes. Close anyway?";

type DrawerProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: DrawerSize;
  dirty?: boolean;
};

export function Drawer({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
  size = DEFAULT_DRAWER_SIZE,
  dirty = false,
}: DrawerProps) {
  const requestClose = useCallback(() => {
    if (dirty && !window.confirm(UNSAVED_CLOSE_PROMPT)) return;
    onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <>
      <div className="scrim on" onClick={requestClose} />
      <aside
        className={cn("drawer on", size === "lg" && "lg")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="between pad" style={{ borderBottom: "1px solid var(--line)" }}>
          <div>
            {eyebrow ? <p className="chip brand">{eyebrow}</p> : null}
            <h2 id="drawer-title" className="h-sec" style={{ marginTop: 6 }}>
              {title}
            </h2>
          </div>
          <button type="button" className="iconbtn" onClick={requestClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="drawer-b">{children}</div>
        {footer ? <div className="pad" style={{ borderTop: "1px solid var(--line)" }}>{footer}</div> : null}
      </aside>
    </>
  );
}
