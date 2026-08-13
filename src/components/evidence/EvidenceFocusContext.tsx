import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { EvidenceRef, EvidenceStatus, Severity } from "@/api/contracts";

export type InsightDrawerPayload = {
  id: string;
  title: string;
  kind: "signal" | "risk" | "objection" | "fact" | "moment";
  severity?: Severity;
  why: string;
  quote?: string;
  speakerName?: string;
  startMs?: number;
  action?: string;
  evidenceStatus?: EvidenceStatus;
};

export type EvidenceFocus = {
  insightId?: string;
  segmentIds: string[];
  play: boolean;
  drawer?: InsightDrawerPayload;
};

type Ctx = {
  focus: EvidenceFocus | null;
  setFocus: (focus: EvidenceFocus) => void;
  clearFocus: () => void;
};

const EvidenceFocusContext = createContext<Ctx | null>(null);

export function EvidenceFocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocusState] = useState<EvidenceFocus | null>(null);
  const setFocus = useCallback((next: EvidenceFocus) => setFocusState(next), []);
  const clearFocus = useCallback(() => setFocusState(null), []);
  const value = useMemo(() => ({ focus, setFocus, clearFocus }), [focus, setFocus, clearFocus]);
  return <EvidenceFocusContext.Provider value={value}>{children}</EvidenceFocusContext.Provider>;
}

export function useEvidenceFocus(): Ctx {
  const ctx = useContext(EvidenceFocusContext);
  if (!ctx) throw new Error("useEvidenceFocus must be used within EvidenceFocusProvider");
  return ctx;
}

export function evidenceToFocus(evidence: EvidenceRef, insightId?: string, play = true): EvidenceFocus {
  return { insightId, segmentIds: evidence.segmentIds, play };
}
