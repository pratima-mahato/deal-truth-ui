import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
  size = "md",
  dirty = false,
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "md" | "lg";
  dirty?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  function requestClose() {
    if (dirtyRef.current && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] isolate" role="presentation">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-ink-950/35 animate-backdrop-in"
        onClick={requestClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-y-0 right-0 flex h-dvh max-h-dvh w-full flex-col border-l border-ink-100 bg-surface shadow-drawer animate-drawer-in outline-none",
          size === "lg" ? "md:w-[70vw] md:max-w-[520px]" : "md:w-[min(70vw,420px)] md:max-w-[420px]",
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-100 bg-surface px-5 py-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{eyebrow}</p>
            ) : null}
            <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight text-ink-900">
              {title}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={requestClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-surface px-5 py-5">
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 border-t border-ink-100 bg-surface px-5 py-4">{footer}</footer>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
