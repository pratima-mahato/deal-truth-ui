import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { applyTheme, readStoredTheme, toggleTheme } from "@/lib/theme";
import { ChakraMark } from "@/components/brand/ChakraMark";
import { DemoLayer } from "@/features/demo/DemoLayer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <div className="tiranga" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <TopNav />
      <main>{children}</main>
      <DemoLayer />
    </div>
  );
}

export function TopNav() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initial = readStoredTheme();
    applyTheme(initial);
    setTheme(initial);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setTheme(toggleTheme());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <span className="brandmark">
            <ChakraMark />
          </span>
          <span className="brandname">
            Deal<em> </em>Truth
          </span>
        </Link>
        <nav className="navlinks">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "navlink on" : "navlink")}>
            Calls
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => (isActive ? "navlink on" : "navlink")}>
            Search
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => (isActive ? "navlink on" : "navlink")}>
            Upload
          </NavLink>
          <NavLink to="/deals/acme" className={({ isActive }) => (isActive ? "navlink on" : "navlink")}>
            Acme deal
          </NavLink>
          <NavLink to="/integrations" className={({ isActive }) => (isActive ? "navlink on" : "navlink")}>
            Integrations
          </NavLink>
        </nav>
        <span className="grow" />
        <form onSubmit={onSearch} className="hstack" style={{ minWidth: 0 }}>
          <input
            className="inp"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search calls…"
            aria-label="Global search"
            style={{ width: 180 }}
          />
        </form>
        <button
          type="button"
          className="iconbtn"
          title="Toggle theme (⌘D)"
          aria-label="Toggle theme"
          onClick={() => setTheme(toggleTheme())}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
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
    <div className="between" style={{ marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
      <div>
        <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-.02em" }}>
          {title}
        </h1>
        {description ? <p className="sub" style={{ marginTop: 8 }}>{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
