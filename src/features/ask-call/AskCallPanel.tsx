import { useState, type FormEvent } from "react";
import { EvidenceReceipt } from "@/components/evidence/EvidenceReceipt";
import { useAsk, useTranscript } from "@/hooks/useCallApi";
import { resolveSegment } from "@/lib/evidence";

const ASK_PROMPTS = [
  "Why is the customer hesitant?",
  "Did they commit to a next meeting?",
  "What do we owe them?",
  "Who is the competitor?",
];

function modeLabel(mode?: string): string {
  if (mode === "generated") return "generated from retrieved moments";
  if (mode === "retrieval_generation_dropped" || mode === "retrieval_generation_failed") {
    return "generation off — moments still retrieved";
  }
  if (mode === "retrieval_lexical_fallback") return "lexical fallback";
  if (mode === "no_index") return "no index";
  return "retrieval first, generation optional";
}

export function AskCallPanel({ callId }: { callId: string }) {
  const [question, setQuestion] = useState(ASK_PROMPTS[0]);
  const ask = useAsk(callId);
  const transcript = useTranscript(callId, true);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (question.trim()) ask.mutate(question.trim());
  }

  return (
    <div className="card pad-lg reveal">
      <div className="between" style={{ marginBottom: 4 }}>
        <span className="h-sec">Ask the call</span>
        <span className="chip brand">{modeLabel(ask.data?.mode)}</span>
      </div>
      <p className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Your question is embedded, matched against this call's segments with pgvector, reranked, and answered{" "}
        <b>only</b> from what comes back. If generation is disabled or fails, you still get the moments.
      </p>
      <form onSubmit={onSubmit} className="hstack" style={{ marginBottom: 11 }}>
        <input
          className="inp big"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-label="Ask the call"
          placeholder="Ask anything about this call…  ⏎"
        />
        <button type="submit" className="btn primary" disabled={ask.isPending}>
          Ask
        </button>
      </form>
      <div className="hstack" style={{ flexWrap: "wrap", marginBottom: 12 }}>
        {ASK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="chip"
            style={{ height: 28, cursor: "pointer" }}
            onClick={() => {
              setQuestion(prompt);
              ask.mutate(prompt);
            }}
          >
            {prompt.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="vstack" style={{ gap: 10 }}>
        {ask.isError ? (
          <p className="tiny" style={{ color: "var(--blocker)" }}>
            {ask.error instanceof Error ? ask.error.message : "Ask failed."}
          </p>
        ) : null}
        {ask.data?.synthesis ? <p className="sub">{ask.data.synthesis}</p> : null}
        {ask.data?.moments.map((moment, index) => {
          const segment = transcript.data ? resolveSegment(transcript.data, moment.evidence.segmentIds[0]) : undefined;
          return (
            <article key={`${moment.title}-${index}`}>
              <h3 style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>{moment.title}</h3>
              {segment ? (
                <EvidenceReceipt segment={segment} transcript={transcript.data} compact />
              ) : (
                <p className="tiny">Retrieved without a playable timestamp.</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
