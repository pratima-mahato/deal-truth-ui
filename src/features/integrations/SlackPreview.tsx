import type { SlackAlert } from "@/api/integrations/contracts";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<SlackAlert["severity"], { bar: string; emoji: string; label: string }> = {
  critical: { bar: "bg-red-600", emoji: "🔴", label: "Critical" },
  warning: { bar: "bg-amber-500", emoji: "🟡", label: "Warning" },
  success: { bar: "bg-emerald-600", emoji: "🟢", label: "Success" },
  info: { bar: "bg-sky-600", emoji: "🔵", label: "Info" },
};

export function SlackPreview({ alert }: { alert: SlackAlert }) {
  const style = SEVERITY_STYLES[alert.severity];
  const accountName =
    alert.account && typeof alert.account.name === "string" ? alert.account.name : undefined;
  const deal = alert.account && typeof alert.account.deal === "string" ? alert.account.deal : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-[#1a1d21] text-white shadow-card">
      <div className={cn("h-1", style.bar)} />
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Slack preview</p>
        <p className="mt-2 text-sm font-semibold">
          {style.emoji} {alert.title || "Notification"}
        </p>
        {accountName || deal ? (
          <div className="mt-2 space-y-0.5 text-xs text-white/70">
            {accountName ? <p className="text-sm font-medium text-white">{accountName}</p> : null}
            {deal ? <p>{deal}</p> : null}
            {typeof alert.account?.amount === "number" ? (
              <p>${alert.account.amount.toLocaleString()}</p>
            ) : typeof alert.account?.amount === "string" ? (
              <p>{alert.account.amount}</p>
            ) : null}
            {typeof alert.account?.timeline === "string" ? (
              <p className="pt-1">Timeline {alert.account.timeline}</p>
            ) : null}
          </div>
        ) : null}
        {alert.message ? <p className="mt-3 text-sm leading-relaxed text-white/90">{alert.message}</p> : null}
        {alert.risks && alert.risks.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {alert.risks.map((risk) => (
              <li key={risk.label} className="text-sm text-amber-200">
                ⚠ {risk.label}
                {risk.description ? <span className="block text-xs text-white/60">{risk.description}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {alert.changes && alert.changes.length > 0 ? (
          <div className="mt-3 space-y-2">
            {alert.changes.map((change) => (
              <div key={change.label} className="rounded-lg bg-white/5 px-3 py-2 text-xs">
                <p className="font-semibold text-white/80">{change.label}</p>
                {change.before ? <p className="mt-1 text-white/50">{change.before}</p> : null}
                {change.after ? <p className="text-white/90">→ {change.after}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
        {alert.evidence && alert.evidence.length > 0 ? (
          <div className="mt-3 space-y-2">
            {alert.evidence.map((item) => (
              <blockquote key={item.quote} className="border-l-2 border-violet-400 pl-3 text-sm italic text-white/85">
                “{item.quote}”
                <footer className="mt-1 not-italic text-[11px] text-white/50">
                  {[item.speaker, item.timestamp].filter(Boolean).join(" · ")}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : null}
        {alert.reportUrl ? (
          <p className="mt-4 text-xs font-medium text-violet-300">View call intelligence →</p>
        ) : null}
        {!alert.enabled ? <p className="mt-3 text-xs text-white/40">This notification will not be sent.</p> : null}
      </div>
    </div>
  );
}
