import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useState, type FormEvent, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 py-4 sm:px-8 sm:py-6">{children}</main>
    </div>
  );
}

export function TopNav() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 sm:gap-4 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-[11px] font-bold text-white">
            OG
          </span>
          <span className="hidden sm:inline">OpenGong</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-xs sm:gap-4 sm:text-sm text-ink-500">
          <NavLink to="/" className={({ isActive }) => (isActive ? "text-ink-900" : "hover:text-ink-800")}>
            Workspace
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => (isActive ? "text-ink-900" : "hover:text-ink-800")}>
            Upload
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => (isActive ? "text-ink-900" : "hover:text-ink-800")}>
            Search
          </NavLink>
          <NavLink to="/integrations" className={({ isActive }) => (isActive ? "text-ink-900" : "hover:text-ink-800")}>
            Integrations
          </NavLink>
        </nav>
        <form onSubmit={onSearch} className="ml-auto flex min-w-0 flex-1 max-w-xl items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search calls…"
              className="pl-9"
              aria-label="Global search"
            />
          </div>
        </form>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
