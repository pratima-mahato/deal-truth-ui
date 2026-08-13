import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative flex flex-wrap gap-1 border-b border-ink-100" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === value}
          className={cn(
            "relative -mb-px px-3 py-2.5 text-sm font-medium transition-colors",
            tab.id === value ? "text-violet-700" : "text-ink-500 hover:text-ink-800",
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.id === value ? (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-violet-600" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
