import type { ProcessingEvent } from "@/api/contracts";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { useCallRefusals } from "@/hooks/useCallApi";

export type RefusedClaim = {
  id: string;
  code: string;
  claim: string;
  why: string;
};

export function refusalsFromEvents(events: ProcessingEvent[]): RefusedClaim[] {
  return events
    .filter(
      (event) =>
        event.state === "failed" &&
        (event.errorCode?.startsWith("EVIDENCE_") || /validate/i.test(event.stage) || /validate/i.test(event.message)),
    )
    .map((event) => ({
      id: event.id,
      code: event.errorCode ?? "EVIDENCE_UNSUPPORTED",
      claim: event.message,
      why: event.message,
    }));
}

export function RefusedClaimsCard({ events, callId }: { events?: ProcessingEvent[]; callId?: string }) {
  const queried = useCallRefusals(callId ?? "", events == null && !!callId);
  const fromApi = queried.data?.refusals ?? [];
  const fromEvents = events ? refusalsFromEvents(events) : [];
  const refusals = fromApi.length ? fromApi : fromEvents;
  const loading = queried.isLoading && events == null;

  if (loading) return null;
  if (queried.isError && events == null && !fromApi.length) {
    return (
      <div className="card pad-lg reveal" style={{ borderColor: "var(--blocker-line)" }}>
        <div className="h-sec" style={{ color: "var(--blocker)", marginBottom: 6 }}>
          Refused claims unavailable
        </div>
        <div className="sub" style={{ fontSize: 12.5 }}>
          {queried.error instanceof Error ? queried.error.message : "The refusals endpoint did not respond."}
        </div>
      </div>
    );
  }

  if (!refusals.length) {
    return (
      <div className="card pad-lg reveal">
        <div className="h-sec" style={{ marginBottom: 6 }}>
          Evidence gate
        </div>
        <div className="sub" style={{ fontSize: 12.5 }}>
          The gate refused {queried.data?.refusedCount ?? 0} claims on this run. Zero is expected when extractors only emit evidenced facts.
        </div>
      </div>
    );
  }

  return (
    <div className="card pad-lg reveal" style={{ borderColor: "var(--blocker-line)" }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <span className="h-sec" style={{ color: "var(--blocker)" }}>
          {refusals.length} claims the model wanted to ship. The gate refused all {refusals.length === 4 ? "four" : refusals.length}.
        </span>
        <span className="chip blocker">Loop depth</span>
      </div>
      <div className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Most tools hide this. We keep every refusal with the reason it failed, so you can audit what the model tried to tell you.
      </div>
      <div className="vstack" style={{ gap: 8 }}>
        {refusals.map((row) => (
          <div key={row.id} className="receipt blocker">
            <div className="receipt-head">
              <EvidenceStamp status="BLOCKER" />
              <span className="receipt-src mono">{row.code}</span>
            </div>
            <div className="receipt-q strike">“{row.claim}”</div>
            <div className="sub" style={{ fontSize: 12 }}>
              {row.why}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
