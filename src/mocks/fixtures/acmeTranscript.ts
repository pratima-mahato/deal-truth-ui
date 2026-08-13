import type { Speaker, Transcript, TranscriptSegment } from "@/api/contracts";
import { segmentId } from "@/lib/segmentId";

export const ACME_CALL_ID = "call-acme-saas-labs";

export const acmeSpeakers: Speaker[] = [
  {
    id: "spk-seller",
    providerSpeakerId: "speaker_0",
    role: "seller",
    displayName: "Rahul Mehta",
    confidence: 0.92,
  },
  {
    id: "spk-customer",
    providerSpeakerId: "speaker_1",
    role: "customer",
    displayName: "Sarah Mitchell",
    confidence: 0.9,
  },
];

function ms(min: number, sec: number): number {
  return (min * 60 + sec) * 1000;
}

type Row = {
  speaker: "spk-seller" | "spk-customer";
  start: [number, number];
  end: [number, number];
  text: string;
};

const rows: Row[] = [
  {
    speaker: "spk-seller",
    start: [0, 12],
    end: [0, 24],
    text: "Sarah, thanks for making time. I wanted to walk through how DealRouter could help the ops team.",
  },
  {
    speaker: "spk-customer",
    start: [0, 26],
    end: [0, 38],
    text: "Happy to. We've been drowning in inbound volume this quarter.",
  },
  {
    speaker: "spk-seller",
    start: [0, 40],
    end: [0, 52],
    text: "Walk me through how routing works today.",
  },
  {
    speaker: "spk-customer",
    start: [0, 54],
    end: [1, 18],
    text: "Right now two coordinators listen to voicemails and assign them in a spreadsheet. It is slow and easy to miss.",
  },
  {
    speaker: "spk-seller",
    start: [1, 22],
    end: [1, 36],
    text: "How long has that been the process?",
  },
  {
    speaker: "spk-customer",
    start: [1, 38],
    end: [2, 2],
    text: "At least a year. We kept saying we'd automate it after the Salesforce cleanup, and that never happened.",
  },
  {
    speaker: "spk-seller",
    start: [2, 8],
    end: [2, 22],
    text: "Who else is involved in evaluating a new vendor?",
  },
  {
    speaker: "spk-customer",
    start: [2, 24],
    end: [2, 48],
    text: "I own operations. My manager cares about time saved. Finance would have to see the number later.",
  },
  {
    speaker: "spk-seller",
    start: [3, 10],
    end: [3, 28],
    text: "Got it. Let me show the routing rules and the Salesforce sync.",
  },
  {
    speaker: "spk-customer",
    start: [3, 32],
    end: [3, 50],
    text: "Salesforce is non-negotiable. If it does not land in the right opportunity, we will not switch.",
  },
  {
    speaker: "spk-seller",
    start: [6, 40],
    end: [7, 2],
    text: "The live board assigns by skill and account owner. Most teams recover several hours a week.",
  },
  {
    speaker: "spk-customer",
    start: [7, 8],
    end: [7, 26],
    text: "That is the part that hurts. People stay late just to shuffle calls.",
  },
  {
    speaker: "spk-seller",
    start: [8, 12],
    end: [8, 30],
    text: "Can you quantify that at all? Even a rough number helps us size the impact.",
  },
  {
    speaker: "spk-customer",
    start: [8, 42],
    end: [8, 58],
    text: "We're losing around 6 hours every week manually routing these calls.",
  },
  {
    speaker: "spk-seller",
    start: [9, 4],
    end: [9, 22],
    text: "Six hours across two coordinators is a meaningful cost before you even count missed follow-ups.",
  },
  {
    speaker: "spk-customer",
    start: [9, 28],
    end: [9, 50],
    text: "Exactly. And the missed ones are worse. A hot lead sits overnight and goes cold.",
  },
  {
    speaker: "spk-seller",
    start: [12, 10],
    end: [12, 32],
    text: "We can auto-create the Salesforce task and notify the owner in Slack.",
  },
  {
    speaker: "spk-customer",
    start: [12, 36],
    end: [12, 58],
    text: "If you can support Salesforce, I think the team would actually use it. That is the bar.",
  },
  {
    speaker: "spk-seller",
    start: [14, 20],
    end: [14, 40],
    text: "Integration is native. We will send the field mapping after this call.",
  },
  {
    speaker: "spk-customer",
    start: [16, 4],
    end: [16, 22],
    text: "The product looks clean. I like the live queue more than what we have.",
  },
  {
    speaker: "spk-seller",
    start: [18, 40],
    end: [19, 2],
    text: "Pricing for your seat count would be around eight hundred a month.",
  },
  {
    speaker: "spk-customer",
    start: [19, 14],
    end: [19, 32],
    text: "That is a jump. I need to understand the commercial piece before I get anyone else excited.",
  },
  {
    speaker: "spk-seller",
    start: [20, 40],
    end: [21, 4],
    text: "What are you paying today for the current routing setup, including people time?",
  },
  {
    speaker: "spk-customer",
    start: [21, 14],
    end: [21, 36],
    text: "We currently pay about $400. This would be almost double.",
  },
  {
    speaker: "spk-seller",
    start: [21, 42],
    end: [22, 8],
    text: "Fair. The comparison I would make is those six hours plus the missed leads, not just the subscription line.",
  },
  {
    speaker: "spk-customer",
    start: [22, 18],
    end: [22, 40],
    text: "If you can support Salesforce, I think we're good to move forward on the product side.",
  },
  {
    speaker: "spk-seller",
    start: [23, 10],
    end: [23, 28],
    text: "Are you looking at anyone else in parallel?",
  },
  {
    speaker: "spk-customer",
    start: [24, 3],
    end: [24, 22],
    text: "We've also got a demo with AcmeAI next Tuesday.",
  },
  {
    speaker: "spk-seller",
    start: [24, 28],
    end: [24, 48],
    text: "What is drawing you to them?",
  },
  {
    speaker: "spk-customer",
    start: [24, 50],
    end: [25, 14],
    text: "They are cheaper. I am not sure they actually write back to Salesforce though.",
  },
  {
    speaker: "spk-seller",
    start: [25, 20],
    end: [25, 40],
    text: "That is usually where those evaluations stall. Anything else that would block a decision?",
  },
  {
    speaker: "spk-customer",
    start: [26, 4],
    end: [26, 26],
    text: "Our security team has to approve any new vendor.",
  },
  {
    speaker: "spk-customer",
    start: [26, 28],
    end: [26, 48],
    text: "We can't onboard another vendor without security review.",
  },
  {
    speaker: "spk-seller",
    start: [27, 10],
    end: [27, 32],
    text: "Understood. We can send SOC2 and the data-flow diagram this week.",
  },
  {
    speaker: "spk-customer",
    start: [27, 40],
    end: [28, 2],
    text: "That would help. I do not own that queue, I just know nothing moves without it.",
  },
  {
    speaker: "spk-seller",
    start: [28, 41],
    end: [28, 58],
    text: "I will send over our SOC2 documentation by Friday.",
  },
  {
    speaker: "spk-seller",
    start: [29, 2],
    end: [29, 10],
    text: "Could you introduce us to the security lead?",
  },
  {
    speaker: "spk-customer",
    start: [29, 11],
    end: [29, 28],
    text: "I can introduce the security lead next week.",
  },
  {
    speaker: "spk-seller",
    start: [30, 20],
    end: [30, 42],
    text: "We should also share the Salesforce object mapping so your admin can sanity-check it.",
  },
  {
    speaker: "spk-seller",
    start: [31, 2],
    end: [31, 16],
    text: "I will send the Salesforce integration documentation tomorrow.",
  },
  {
    speaker: "spk-seller",
    start: [31, 42],
    end: [32, 2],
    text: "It sounds like you are ready to purchase this month once those docs land.",
  },
  {
    speaker: "spk-customer",
    start: [32, 10],
    end: [32, 32],
    text: "We still need to evaluate two other vendors, and security has to sign off before we can move ahead.",
  },
  {
    speaker: "spk-seller",
    start: [32, 40],
    end: [33, 2],
    text: "Completely fair. What would a good next conversation look like?",
  },
  {
    speaker: "spk-customer",
    start: [33, 20],
    end: [33, 42],
    text: "Send me the packet. I will circulate it internally.",
  },
  {
    speaker: "spk-seller",
    start: [33, 50],
    end: [34, 4],
    text: "Can we lock a follow-up on the calendar for next week?",
  },
  {
    speaker: "spk-customer",
    start: [34, 8],
    end: [34, 24],
    text: "Send me something and I'll get back to you.",
  },
  {
    speaker: "spk-seller",
    start: [34, 51],
    end: [35, 8],
    text: "Great — looking forward to reconnecting next week then.",
  },
  {
    speaker: "spk-customer",
    start: [35, 20],
    end: [35, 36],
    text: "I'll speak with finance. No promises on timing.",
  },
  {
    speaker: "spk-seller",
    start: [36, 10],
    end: [36, 28],
    text: "I will include a one-pager that frames price against the six hours a week.",
  },
  {
    speaker: "spk-customer",
    start: [36, 40],
    end: [36, 58],
    text: "That would be useful. Thanks for walking through it.",
  },
  {
    speaker: "spk-seller",
    start: [37, 20],
    end: [37, 40],
    text: "Thank you, Sarah. Docs tomorrow and Friday, and we will wait on security.",
  },
  {
    speaker: "spk-customer",
    start: [37, 48],
    end: [38, 6],
    text: "Sounds good. Talk soon.",
  },
];

export const ACME_SEGMENTS = {
  pain: segmentId(14),
  salesforceRequirement: segmentId(10),
  pricing: segmentId(24),
  buyingIntent: segmentId(26),
  competitor: segmentId(28),
  competitorConcern: segmentId(30),
  security: segmentId(32),
  securityReview: segmentId(33),
  soc2: segmentId(36),
  securityIntro: segmentId(38),
  salesforceDocs: segmentId(40),
  sellerOverstate: segmentId(41),
  customerPushback: segmentId(42),
  weakNext: segmentId(46),
  sellerNextWeek: segmentId(47),
  finance: segmentId(48),
} as const;

export function buildAcmeTranscript(callId = ACME_CALL_ID): Transcript {
  const segments: TranscriptSegment[] = rows.map((row, index) => ({
    id: segmentId(index + 1),
    speakerId: row.speaker,
    startMs: ms(row.start[0], row.start[1]),
    endMs: ms(row.end[0], row.end[1]),
    text: row.text,
    sequenceNumber: index + 1,
  }));

  return {
    callId,
    language: "en",
    text: segments.map((s) => s.text).join(" "),
    speakers: acmeSpeakers,
    segments,
  };
}

export function quoteAt(transcript: Transcript, id: string): string {
  const segment = transcript.segments.find((s) => s.id === id);
  if (!segment) throw new Error(`Missing segment ${id}`);
  return segment.text;
}
