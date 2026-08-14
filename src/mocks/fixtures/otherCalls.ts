import type { Call, CallReport, Speaker, Transcript, TranscriptSegment } from "@/api/contracts";
import { demoCall, buildDemoReport } from "./demoReport";
import { segmentId } from "@/lib/segmentId";

function speakers(seller: string, customer: string): Speaker[] {
  return [
    { id: "spk-seller", providerSpeakerId: "speaker_0", role: "seller", displayName: seller, confidence: 0.9 },
    { id: "spk-customer", providerSpeakerId: "speaker_1", role: "customer", displayName: customer, confidence: 0.88 },
  ];
}

function segs(callId: string, lines: { who: "spk-seller" | "spk-customer"; t: string; start: number; text: string }[]): Transcript {
  const segments: TranscriptSegment[] = lines.map((line, i) => ({
    id: segmentId(i + 1),
    speakerId: line.who,
    startMs: line.start,
    endMs: line.start + 12000,
    text: line.text,
    sequenceNumber: i + 1,
  }));
  return {
    callId,
    language: "en",
    text: segments.map((s) => s.text).join(" "),
    speakers: [],
    segments,
  };
}

export const northstarCall: Call = {
  id: "call-northstar-renewal",
  title: "Northstar renewal",
  customerName: "Priya Shah · Northstar",
  repName: "Sachin Iyer",
  callDirection: "outbound",
  status: "SHIPPED",
  terminalOutcome: "SHIPPED",
  durationMs: 1680000,
  language: "en",
  createdAt: "2026-08-10T11:00:00.000Z",
  updatedAt: "2026-08-10T11:40:00.000Z",
  completedAt: "2026-08-10T11:40:00.000Z",
  sourceType: "upload",
  biggestRisk: "Pricing objection",
  signalBadges: ["Pricing objection", "Next meeting set", "Pain identified", "Impact quantified", "Decision maker"],
  signalPips: ["proven", "proven", "proven", "missing", "proven", "proven", "missing", "weak"],
};

export const helixCall: Call = {
  id: "call-helix-discovery",
  title: "Helix discovery",
  customerName: "Marcus Lee · Helix",
  repName: "Rahul Mehta",
  callDirection: "inbound",
  status: "SHIPPED",
  terminalOutcome: "SHIPPED",
  durationMs: 1420000,
  language: "en",
  createdAt: "2026-08-09T16:20:00.000Z",
  updatedAt: "2026-08-09T16:50:00.000Z",
  completedAt: "2026-08-09T16:50:00.000Z",
  sourceType: "upload",
  biggestRisk: "No next step",
  signalBadges: ["Pain identified", "No next meeting", "Decision maker"],
  signalPips: ["proven", "missing", "proven", "missing", "missing", "blocked", "missing", "missing"],
};

export const orbitCall: Call = {
  id: "call-orbit-security",
  title: "Orbit technical review",
  customerName: "Elena Voss · Orbit",
  repName: "Sachin Iyer",
  callDirection: "outbound",
  status: "SHIPPED",
  terminalOutcome: "SHIPPED",
  durationMs: 2100000,
  language: "en",
  createdAt: "2026-08-08T09:10:00.000Z",
  updatedAt: "2026-08-08T09:55:00.000Z",
  completedAt: "2026-08-08T09:55:00.000Z",
  sourceType: "upload",
  biggestRisk: "Competitor preference",
  signalBadges: ["Competitor mentioned", "Security blocker", "Pain identified", "Impact quantified", "Decision maker", "Economic buyer"],
  signalPips: ["proven", "proven", "proven", "proven", "weak", "weak", "blocked", "missing"],
};

export const lumenCall: Call = {
  id: "call-lumen-partial",
  title: "Lumen expansion",
  customerName: "Jonah Park · Lumen",
  repName: "Rahul Mehta",
  callDirection: "outbound",
  status: "PARTIAL",
  terminalOutcome: "PARTIAL",
  failureKind: "ML_INFERENCE",
  failureCode: "ML_SERVICE_UNAVAILABLE",
  failureMessage: "Transcript is available, but emotion analysis is temporarily unavailable.",
  durationMs: 1860000,
  language: "en",
  createdAt: "2026-08-12T13:00:00.000Z",
  updatedAt: "2026-08-12T13:32:00.000Z",
  completedAt: "2026-08-12T13:32:00.000Z",
  sourceType: "upload",
  biggestRisk: "Budget blocker",
  signalBadges: ["Partial report", "Pain identified", "Impact quantified", "Budget blocker", "Timeline"],
  signalPips: ["proven", "proven", "missing", "blocked", "proven", "missing", "missing", "blocked"],
};

export const vegaCall: Call = {
  id: "call-vega-failed",
  title: "Vega intro (failed transcription)",
  customerName: "Amina Cole · Vega",
  repName: "Sachin Iyer",
  callDirection: "outbound",
  status: "FAILED",
  terminalOutcome: "FAILED",
  failureKind: "TRANSCRIPTION",
  failureCode: "PYAI_JOB_FAILED",
  failureMessage: "Transcription failed. You can retry processing; this is not a deal-quality failure.",
  durationMs: 0,
  language: "en",
  createdAt: "2026-08-12T18:10:00.000Z",
  updatedAt: "2026-08-12T18:16:00.000Z",
  sourceType: "upload",
};

export const zenithCall: Call = {
  id: "call-zenith-processing",
  title: "Zenith kickoff",
  customerName: "Chris Ndlovu · Zenith",
  repName: "Rahul Mehta",
  callDirection: "outbound",
  status: "ANALYZING",
  durationMs: 1540000,
  language: "en",
  createdAt: "2026-08-13T08:40:00.000Z",
  updatedAt: "2026-08-13T08:47:00.000Z",
  sourceType: "upload",
};

export const seedCalls: Call[] = [
  demoCall,
  northstarCall,
  helixCall,
  orbitCall,
  lumenCall,
  vegaCall,
  zenithCall,
];

export function northstarTranscript(): Transcript {
  const t = segs(northstarCall.id, [
    { who: "spk-seller", t: "Sachin", start: 12000, text: "Priya, thanks for jumping on the renewal conversation." },
    { who: "spk-customer", t: "Priya", start: 28000, text: "We like the product. Pricing is the only open item." },
    { who: "spk-customer", t: "Priya", start: 64000, text: "Your price is almost twice what we pay on the current plan." },
    { who: "spk-seller", t: "Sachin", start: 90000, text: "We can walk finance through usage so the increase is easier to defend." },
    { who: "spk-customer", t: "Priya", start: 140000, text: "Let's put 30 minutes on Thursday with finance." },
  ]);
  t.speakers = speakers("Sachin Iyer", "Priya Shah");
  return t;
}

export function helixTranscript(): Transcript {
  const t = segs(helixCall.id, [
    { who: "spk-customer", t: "Marcus", start: 20000, text: "We are wasting a full day every week reconciling call notes by hand." },
    { who: "spk-seller", t: "Rahul", start: 80000, text: "That is exactly the workflow we automate." },
    { who: "spk-customer", t: "Marcus", start: 160000, text: "Send me something and I will look when I can." },
    { who: "spk-seller", t: "Rahul", start: 190000, text: "Can we book a follow-up next week?" },
    { who: "spk-customer", t: "Marcus", start: 210000, text: "Not yet. I will ping you." },
  ]);
  t.speakers = speakers("Rahul Mehta", "Marcus Lee");
  return t;
}

export function orbitTranscript(): Transcript {
  const t = segs(orbitCall.id, [
    { who: "spk-customer", t: "Elena", start: 40000, text: "We already like VoiceForge. They are cheaper and our security questionnaire is done." },
    { who: "spk-seller", t: "Sachin", start: 90000, text: "We can complete security this week if that is the gate." },
    { who: "spk-customer", t: "Elena", start: 150000, text: "Our security team has to approve any new vendor, even if we prefer your product." },
    { who: "spk-customer", t: "Elena", start: 210000, text: "Prospects keep asking about competitors in every late-stage call." },
  ]);
  t.speakers = speakers("Sachin Iyer", "Elena Voss");
  return t;
}

export function lumenTranscript(): Transcript {
  const t = segs(lumenCall.id, [
    { who: "spk-customer", t: "Jonah", start: 30000, text: "This is impressive, but there's no chance we have budget this quarter." },
    { who: "spk-seller", t: "Rahul", start: 80000, text: "Would a start date next quarter unblock a technical evaluation now?" },
    { who: "spk-customer", t: "Jonah", start: 140000, text: "Maybe. Finance froze new software until October." },
  ]);
  t.speakers = speakers("Rahul Mehta", "Jonah Park");
  return t;
}

function cloneReport(base: CallReport, call: Call, overrides: Partial<CallReport>): CallReport {
  return {
    ...base,
    ...overrides,
    call,
    summary: overrides.summary ?? {
      ...base.summary,
      headline: call.title,
      tldr: call.biggestRisk ?? base.summary.tldr,
    },
  };
}

const demoTemplate = buildDemoReport();

export function northstarReport(): CallReport {
  return cloneReport(demoTemplate, northstarCall, {
    dealSignals: [
      { id: "pain", label: "Pain identified", state: "positive" },
      { id: "blocker", label: "Pricing objection", state: "warning" },
      { id: "next_meeting", label: "Next meeting committed", state: "positive" },
    ],
    customerTruth: [
      {
        id: "ns-price",
        category: "budget",
        title: "Price is almost twice current plan",
        summary: "Renewal is blocked on commercial terms.",
        quote: "Your price is almost twice what we pay on the current plan.",
        speakerName: "Priya",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(3)] },
      },
    ],
    objections: [
      {
        id: "ns-obj",
        kind: "pricing",
        title: "Renewal pricing objection",
        summary: "Customer compared new pricing to the current plan.",
        severity: "high",
        coaching: "Bring usage data to finance on Thursday.",
        evidence: { segmentIds: [segmentId(3)] },
      },
    ],
    commitments: [
      {
        id: "ns-thu",
        side: "customer",
        owner: "Priya",
        action: "Finance follow-up Thursday",
        dueText: "Thursday",
        status: "committed",
        evidence: { segmentIds: [segmentId(5)] },
      },
    ],
    risks: [
      {
        id: "ns-risk",
        title: "Pricing objection",
        summary: "Renewal may slip if finance rejects the increase.",
        severity: "high",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(3)] },
      },
    ],
    realityChecks: [],
    competitors: [],
    unavailableSections: [],
  });
}

export function helixReport(): CallReport {
  return cloneReport(demoTemplate, helixCall, {
    dealSignals: [
      { id: "pain", label: "Pain identified", state: "positive" },
      { id: "next_meeting", label: "Next meeting committed", state: "missing" },
    ],
    customerTruth: [
      {
        id: "hx-pain",
        category: "pain",
        title: "A full day lost reconciling notes",
        summary: "Manual call-note cleanup is eating a day a week.",
        quote: "We are wasting a full day every week reconciling call notes by hand.",
        speakerName: "Marcus",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(1)] },
      },
    ],
    objections: [],
    commitments: [
      {
        id: "hx-next",
        side: "customer",
        owner: "Marcus",
        action: "Commit to a next meeting",
        status: "not_committed",
        evidence: { segmentIds: [segmentId(5)] },
      },
    ],
    risks: [
      {
        id: "hx-risk",
        title: "No next step",
        summary: "Customer refused to book a follow-up.",
        severity: "high",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(5)] },
      },
    ],
    realityChecks: [],
    competitors: [],
  });
}

export function orbitReport(): CallReport {
  return cloneReport(demoTemplate, orbitCall, {
    dealSignals: [
      { id: "competitor", label: "Competition active", state: "negative" },
      { id: "blocker", label: "Security blocker", state: "negative" },
    ],
    customerTruth: [
      {
        id: "or-comp",
        category: "competition",
        title: "Prefers VoiceForge",
        summary: "Cheaper competitor already cleared security.",
        quote: "We already like VoiceForge. They are cheaper and our security questionnaire is done.",
        speakerName: "Elena",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(1)] },
      },
      {
        id: "or-sec",
        category: "blocker",
        title: "Security must still approve",
        summary: "Even a preferred vendor waits on security.",
        quote: "Our security team has to approve any new vendor, even if we prefer your product.",
        speakerName: "Elena",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(3)] },
      },
    ],
    objections: [
      {
        id: "or-obj",
        kind: "competition",
        title: "Competitor preference",
        summary: "VoiceForge is cheaper and already through security.",
        severity: "high",
        coaching: "Complete the security packet this week and differentiate Salesforce depth.",
        evidence: { segmentIds: [segmentId(1)] },
      },
    ],
    competitors: [
      {
        id: "or-vf",
        name: "VoiceForge",
        stance: "Preferred",
        likes: ["Lower price", "Security questionnaire complete"],
        concerns: [],
        evidence: { segmentIds: [segmentId(1)] },
      },
    ],
    commitments: [],
    risks: [
      {
        id: "or-risk",
        title: "Competitor preference",
        summary: "VoiceForge is ahead on price and security paperwork.",
        severity: "high",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(1)] },
      },
    ],
    realityChecks: [],
  });
}

export function lumenReport(): CallReport {
  const report = cloneReport(demoTemplate, lumenCall, {
    dealSignals: [
      { id: "intent", label: "Buying intent", state: "warning" },
      { id: "blocker", label: "Budget blocker", state: "negative" },
    ],
    customerTruth: [
      {
        id: "lm-budget",
        category: "budget",
        title: "No budget this quarter",
        summary: "Positive product reaction, frozen budget.",
        quote: "This is impressive, but there's no chance we have budget this quarter.",
        speakerName: "Jonah",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(1)] },
      },
    ],
    objections: [
      {
        id: "lm-obj",
        kind: "budget",
        title: "Budget frozen until October",
        summary: "Finance froze new software purchases.",
        severity: "high",
        coaching: "Keep a technical evaluation alive without claiming a this-quarter close.",
        evidence: { segmentIds: [segmentId(3)] },
      },
    ],
    commitments: [],
    risks: [
      {
        id: "lm-risk",
        title: "Budget blocker",
        summary: "No commercial path until next quarter.",
        severity: "high",
        evidenceStatus: "SUPPORTED",
        evidence: { segmentIds: [segmentId(1)] },
      },
    ],
    realityChecks: [],
    competitors: [],
    buyerSentiment: {
      overall: "Unavailable",
      trajectory: "Emotion analysis did not complete.",
      disclaimer: "Emotion is not buying intent.",
      points: [],
    },
    unavailableSections: ["buyerSentiment"],
  });
  return report;
}
