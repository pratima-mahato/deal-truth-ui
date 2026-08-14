import type { Deal, DealCall } from "@/api/contracts";
import { DEAL_DIMENSIONS, type DimensionState } from "@/lib/evidence";
import { formatDuration } from "@/lib/utils";

export type DealCell = DimensionState;

export type DealRegression = {
  id: string;
  title: string;
  was: DealCell;
  now: DealCell;
  note: string;
  playable: boolean;
  callId: string;
};

const CELL_LABEL: Record<DealCell, string> = {
  proven: "proven",
  blocked: "blocked",
  weak: "weak",
  missing: "not found",
};

export function cellLabel(state: DealCell): string {
  return CELL_LABEL[state] ?? "not found";
}

export function countStates(states: DealCall["states"], kind: DealCell): number {
  return Object.values(states).filter((value) => value === kind).length;
}

export function formatDealDate(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleString(undefined, { day: "numeric", month: "short" });
}

export function formatDealDuration(ms: number): string {
  if (!ms) return "—";
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) return formatDuration(ms);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function accountLabel(deal: Deal): string {
  const account = deal.accountName.trim();
  if (account) return account.includes("·") ? account.split("·").pop()?.trim() || account : account;
  return "This deal";
}

export function contactLabel(deal: Deal): string {
  if (deal.primaryContact?.trim()) return deal.primaryContact.trim();
  const account = deal.accountName.trim();
  if (account.includes("·")) return account.split("·")[0]?.trim() || "";
  return "";
}

export function regressionsFor(deal: Deal): DealRegression[] {
  const fromDeltas = deal.deltas
    .map((delta) => {
      const dim = DEAL_DIMENSIONS.find((item) => item.id === delta.dimension || item.label === delta.dimension);
      const was = (["proven", "blocked", "weak", "missing"] as const).includes(delta.from as DealCell)
        ? (delta.from as DealCell)
        : "missing";
      const now = (["proven", "blocked", "weak", "missing"] as const).includes(delta.to as DealCell)
        ? (delta.to as DealCell)
        : "missing";
      const worsened =
        (was === "proven" && now !== "proven") || (was !== "blocked" && now === "blocked");
      if (!worsened) return null;
      const row: DealRegression = {
        id: `${delta.dimension}-${delta.callId ?? now}`,
        title: dim?.label ?? delta.dimension,
        was,
        now,
        note: delta.note || `${dim?.label ?? delta.dimension} moved from ${cellLabel(was)} to ${cellLabel(now)}.`,
        playable: now === "blocked",
        callId: delta.callId || deal.calls.at(-1)?.callId || "",
      };
      return row;
    })
    .filter((item): item is DealRegression => item != null);
  if (fromDeltas.length) return fromDeltas;

  if (deal.calls.length < 2) return [];
  const previous = deal.calls[deal.calls.length - 2];
  const latest = deal.calls[deal.calls.length - 1];
  return DEAL_DIMENSIONS.flatMap((dim) => {
    const was = previous.states[dim.id] ?? "missing";
    const now = latest.states[dim.id] ?? "missing";
    const worsened =
      (was === "proven" && now !== "proven") || (was !== "blocked" && now === "blocked");
    if (!worsened) return [];
    const absence = now === "missing";
    return [
      {
        id: dim.id,
        title: dim.label,
        was,
        now,
        note: absence
          ? "Nothing was said on this call — there is no clip to play. That is the finding."
          : `${dim.label} moved from ${cellLabel(was)} to ${cellLabel(now)}.`,
        playable: now === "blocked",
        callId: latest.callId,
      },
    ];
  });
}

export function dealFinding(deal: Deal): string {
  if (deal.calls.length < 2) {
    return deal.calls.length
      ? "Only one call is in this deal so far. Later calls will show which dimensions moved."
      : "No calls are attached to this deal yet.";
  }
  const previous = deal.calls[deal.calls.length - 2];
  const latest = deal.calls[deal.calls.length - 1];
  const lost = DEAL_DIMENSIONS.filter(
    (dim) => previous.states[dim.id] === "proven" && latest.states[dim.id] !== "proven",
  ).map((dim) => dim.label.toLowerCase());
  const gained = DEAL_DIMENSIONS.filter(
    (dim) => previous.states[dim.id] !== "blocked" && latest.states[dim.id] === "blocked",
  ).map((dim) => dim.label.toLowerCase());
  if (!lost.length && !gained.length) {
    return "Dimensions held between the last two calls. Nothing silently disappeared.";
  }
  const lostText = lost.length ? `lost ${joinList(lost)}` : "";
  const gainedText = gained.length ? `gained ${joinList(gained)}` : "";
  const change = [lostText, gainedText].filter(Boolean).join(", and ");
  return `This deal changed since ${formatDealDate(previous.createdAt)}. It has ${change}.`;
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
