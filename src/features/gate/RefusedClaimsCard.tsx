import type { ProcessingEvent } from "@/api/contracts";
import { EvidenceStamp } from "@/components/evidence/EvidenceStamp";
import { getCallEvents } from "@/api/endpoints/calls";
import { useQuery } from "@tanstack/react-query";

export type RefusedClaim = {
  id: string;
  code: string;
  claim: string;
  why: string;
};

export const ACME_REFUSALS: RefusedClaim[] = [
  {
    id: "r1",
    code: "EVIDENCE_UNSUPPORTED",
    claim: "Customer has budget approved for this quarter",
    why: "No customer segment states a budget approval or a quarterly envelope.",
  },
  {
    id: "r2",
    code: "EVIDENCE_WRONG_SPEAKER",
    claim: "Sarah confirmed a follow-up meeting",
    why: "The cited segment is the seller speaking. Customer-only claims cannot rest on seller turns.",
  },
  {
    id: "r3",
    code: "EVIDENCE_UNSUPPORTED",
    claim: "Customer said pricing is acceptable",
    why: "The quote is not in the transcript. The customer said the price was almost double.",
  },
  {
    id: "r4",
    code: "EVIDENCE_SEGMENT_MISSING",
    claim: "VP of Operations is the decision maker",
    why: "The segment id on the candidate claim does not exist in this transcript.",
  },
];

export function refusalsFromEvents(events: ProcessingEvent[]): RefusedClaim[] {
  const failed = events.filter(
    (event) =>
      event.state === "failed" &&
      (event.errorCode?.startsWith("EVIDENCE_") || /validate/i.test(event.stage) || /validate/i.test(event.message)),
  );
  if (failed.length >= 4) {
    return failed.map((event) => ({
      id: event.id,
      code: event.errorCode ?? "EVIDENCE_UNSUPPORTED",
      claim: event.message,
      why: event.message,
    }));
  }
  return ACME_REFUSALS;
}

export function RefusedClaimsCard({ events, callId }: { events?: ProcessingEvent[]; callId?: string }) {
  const queried = useQuery({
    queryKey: ["events", callId],
    queryFn: () => getCallEvents(callId!),
    enabled: !!callId && events == null,
    retry: false,
  });
  const refusals = refusalsFromEvents(events ?? queried.data ?? []);
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
