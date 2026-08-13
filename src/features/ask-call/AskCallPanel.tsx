import { useState, type FormEvent } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { useAsk } from "@/hooks/useCallApi";

export function AskCallPanel({ callId }: { callId: string }) {
  const [question, setQuestion] = useState("Why is the customer hesitant?");
  const ask = useAsk(callId);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (question.trim()) ask.mutate(question.trim());
  }

  return (
    <Card>
      <CardHeader title="Ask this call" description="Retrieval first. If synthesis is unavailable, you still get playable moments." />
      <form onSubmit={onSubmit} className="flex gap-2 px-5 pt-4">
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} aria-label="Ask the call" />
        <Button type="submit" disabled={ask.isPending}>
          Ask
        </Button>
      </form>
      <div className="space-y-3 p-5">
        {ask.isError ? (
          <p className="text-sm text-red-700">
            {ask.error instanceof Error ? ask.error.message : "Ask failed."}
          </p>
        ) : null}
        {ask.data?.synthesis ? <p className="text-sm text-navy-800">{ask.data.synthesis}</p> : null}
        {ask.data?.moments.map((moment, index) => (
          <article key={`${moment.title}-${index}`} className="rounded-lg border border-slate-100 p-3">
            <h3 className="text-sm font-semibold">{moment.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{moment.snippet}</p>
            <EvidenceLink evidence={moment.evidence} insightId={`ask-${index}`} />
          </article>
        ))}
      </div>
    </Card>
  );
}
