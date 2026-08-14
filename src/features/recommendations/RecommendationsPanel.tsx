import { Link } from "react-router-dom";
import type { Recommendation } from "@/api/contracts";

export function RecommendationsPanel({ items }: { items: Recommendation[] }) {
  if (!items.length) return null;
  return (
    <div className="card pad">
      <div className="h-sec" style={{ marginBottom: 8 }}>Suggested explorations</div>
      <div className="vstack" style={{ gap: 4 }}>
        {items.map((item) => (
          <Link key={item.id} to={`/search?q=${encodeURIComponent(item.query)}`} className="between" style={{ padding: "8px 0" }}>
            <span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</span>
              <span className="tiny" style={{ display: "block" }}>{item.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
