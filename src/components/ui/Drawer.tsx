import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

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
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-ink-900/20" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative z-10 flex h-full w-full max-w-md animate-drawer-in flex-col border-l border-ink-100 bg-surface shadow-drawer"
      >
        <header className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{eyebrow}</p>
            ) : null}
            <h2 id="drawer-title" className="mt-1 text-lg font-semibold tracking-tight text-ink-900">
              {title}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <footer className="border-t border-ink-100 px-5 py-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}
