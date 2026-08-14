const SUMMARY_KEYS = /summary|recap/i;

const SECTION_COPY: Record<string, string> = {
  buyerSentiment: "Emotion analysis is temporarily unavailable — extraction and evidence are unaffected.",
};

export function isSummaryUnavailable(unavailable: Iterable<string> = []): boolean {
  return [...unavailable].some((key) => SUMMARY_KEYS.test(key));
}

export function partialReportMessage(unavailable: Iterable<string>, isPartial: boolean): string | null {
  const keys = [...unavailable];
  if (!isPartial && keys.length === 0) return null;

  const parts: string[] = [];
  const named = new Set<string>();

  if (keys.includes("buyerSentiment")) {
    parts.push(SECTION_COPY.buyerSentiment);
    named.add("buyerSentiment");
  }

  if (isSummaryUnavailable(keys)) {
    parts.push("Baseline summary unavailable — extraction and evidence are unaffected.");
    for (const key of keys) {
      if (SUMMARY_KEYS.test(key)) named.add(key);
    }
  }

  const leftover = keys.filter((key) => !named.has(key));
  if (leftover.length) {
    parts.push(`Degraded: ${leftover.join(", ")}.`);
  }

  if (!parts.length) {
    return "This report shipped partial. Extraction and evidence that passed the gate are shown below.";
  }
  return parts.join(" ");
}
