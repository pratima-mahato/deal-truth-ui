import { useMemo, useState } from "react";
import type { FollowUpEmail } from "@/api/contracts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { useFollowUp } from "@/hooks/useCallApi";
import { cn } from "@/lib/utils";

export function FollowUpPanel({ callId, initial }: { callId: string; initial?: FollowUpEmail }) {
  const mutation = useFollowUp(callId);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const email = mutation.data ?? initial;

  const visible = useMemo(
    () => email?.sentences.filter((s) => !removed.has(s.id)) ?? [],
    [email, removed],
  );

  function copy() {
    void navigator.clipboard.writeText(visible.map((s) => s.text).join(" "));
  }

  return (
    <Card>
      <CardHeader
        title="Evidence-safe follow-up"
        description="Every factual sentence must carry transcript evidence. Unsupported claims stay visible until you remove them."
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => mutation.mutate()}>
              Generate
            </Button>
            <Button size="sm" variant="ghost" onClick={copy} disabled={!visible.length}>
              Copy
            </Button>
          </div>
        }
      />
      <div className="space-y-3 p-5">
        {mutation.isError ? (
          <p className="text-sm text-red-700">
            {mutation.error instanceof Error ? mutation.error.message : "Follow-up failed."}
          </p>
        ) : null}
        {email ? <p className="text-sm font-medium">Subject: {email.subject}</p> : null}
        {visible.map((sentence) => (
          <div
            key={sentence.id}
            className={cn(
              "rounded-lg border p-3 text-sm",
              sentence.kind === "unsupported" && "border-red-200 bg-red-50",
              sentence.kind === "factual" && "border-teal-100 bg-teal-50/40",
              sentence.kind === "non_factual" && "border-slate-100",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p>{sentence.text}</p>
              {sentence.kind === "factual" ? <Badge tone="positive">Supported</Badge> : null}
              {sentence.kind === "unsupported" ? <Badge tone="danger">Unsupported</Badge> : null}
            </div>
            {sentence.kind === "unsupported" ? (
              <div className="mt-2">
                <p className="text-xs text-red-800">{sentence.explanation}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setRemoved((prev) => new Set(prev).add(sentence.id))}
                >
                  Remove
                </Button>
              </div>
            ) : null}
            {sentence.evidenceSegmentIds.length ? (
              <EvidenceLink evidence={{ segmentIds: sentence.evidenceSegmentIds }} insightId={sentence.id} />
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
