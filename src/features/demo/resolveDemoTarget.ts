import { env } from "@/config/env";
import { isReportReadyStatus, type Call } from "@/api/contracts";

/** Pick a call that already exists in the API. Never invent an id. */
export function pickDemoCall(items: Call[]): Call | undefined {
  if (!items.length) return undefined;
  const preferred = env.demoCallId.trim();
  const ready = items.filter((call) => isReportReadyStatus(call.status));
  if (preferred) {
    return ready.find((call) => call.id === preferred) ?? items.find((call) => call.id === preferred);
  }
  return ready[0] ?? items[0];
}
