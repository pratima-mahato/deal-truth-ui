import { Link } from "react-router-dom";
import type { Recommendation } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";

export function RecommendationsPanel({ items }: { items: Recommendation[] }) {
  if (!items.length) return null;
  return (
    <Card>
      <CardHeader title="Suggested explorations" description="Queries derived from recent call intelligence." />
      <ul className="grid gap-0 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="border-t border-ink-100/80 sm:odd:border-r">
            <Link to={`/search?q=${encodeURIComponent(item.query)}`} className="block px-5 py-4 hover:bg-violet-50/60">
              <p className="text-sm font-medium text-ink-900">{item.title}</p>
              <p className="mt-1 text-sm text-ink-500">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
