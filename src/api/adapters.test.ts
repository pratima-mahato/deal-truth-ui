import { describe, expect, it } from "vitest";
import { mapCall, mapCallList, mapDeal, mapEvent, mapEvidence, mapFollowUp, mapRecommendations, mapRefusals, mapReport, mapSearchResponse, mapShareLink, mapSnapshot, mapTranscript } from "@/api/adapters";
import { toWireCall, toWireTranscript, toWireReport } from "@/mocks/toWire";
import { buildDemoTranscript } from "@/mocks/fixtures/demoTranscript";
import { demoCall, buildDemoReport } from "@/mocks/fixtures/demoReport";
import { segmentId } from "@/lib/segmentId";

describe("mapCallList", () => {
  it("wraps a bare CallSummary array", () => {
    const listed = mapCallList([
      {
        id: "11111111-1111-4111-8111-111111111111",
        public_call_id: "pub-1",
        title: "Discovery",
        customer_name: "Example",
        status: "SHIPPED",
        terminal_outcome: "SHIPPED",
        duration_ms: 120000,
        created_at: "2026-08-11T00:00:00.000Z",
        updated_at: "2026-08-11T00:10:00.000Z",
      },
    ]);
    expect(listed.total).toBe(1);
    expect(listed.items[0]?.customerName).toBe("Example");
    expect(listed.items[0]?.repName).toBe("");
    expect(listed.items[0]?.durationMs).toBe(120000);
  });
});

describe("mapTranscript", () => {
  it("converts UUID segments and joins text", () => {
    const transcript = mapTranscript({
      call_id: "c1",
      language: "en",
      duration_ms: 5000,
      speakers: [
        {
          id: "spk-a",
          provider_speaker_id: "speaker_0",
          role: "seller",
          display_name: null,
          confidence: 0.9,
          manually_overridden: false,
        },
      ],
      segments: [
        {
          id: segmentId(1),
          speaker_id: "spk-a",
          speaker_role: "seller",
          start_ms: 0,
          end_ms: 1200,
          text: "Hello there.",
          sequence_number: 1,
        },
      ],
    });
    expect(transcript.segments[0]?.id).toBe(segmentId(1));
    expect(transcript.speakers[0]?.displayName).toBe("speaker_0");
    expect(transcript.text).toBe("Hello there.");
  });

  it("round-trips the demo fixture through wire shape", () => {
    const original = buildDemoTranscript();
    const mapped = mapTranscript(toWireTranscript(original));
    expect(mapped.segments[0]?.id).toBe(original.segments[0]?.id);
    expect(mapped.segments).toHaveLength(original.segments.length);
    expect(mapped.text).toContain("Sounds good");
  });

  it("sorts out-of-order segments and infers duration", () => {
    const transcript = mapTranscript({
      call_id: "c1",
      speakers: [],
      segments: [
        { id: "late", speaker_id: "a", start_ms: 224000, end_ms: 230000, text: "bye", sequence_number: 2 },
        { id: "early", speaker_id: "a", start_ms: 0, end_ms: 1200, text: "hello", sequence_number: 1 },
      ],
    });
    expect(transcript.segments.map((s) => s.id)).toEqual(["early", "late"]);
    expect(transcript.durationMs).toBe(230000);
  });
});

describe("mapEvidence", () => {
  it("flattens evidence_links in sort order", () => {
    const evidence = mapEvidence({
      evidence_links: [
        { transcript_segment_id: "b", sort_order: 2 },
        { transcript_segment_id: "a", sort_order: 1 },
      ],
    });
    expect(evidence.segmentIds).toEqual(["a", "b"]);
  });
});

describe("mapEvent stages", () => {
  it("maps live EventOut short names to CallStatus", () => {
    const upload = mapEvent(
      {
        id: "e-upload",
        stage: "upload",
        state: "SUCCEEDED",
        attempt: 1,
        error_code: null,
        message: null,
        created_at: "2026-08-13T12:38:40.000Z",
      },
      "call-1",
    );
    const transcribe = mapEvent(
      {
        id: "e-transcribe",
        stage: "transcribe",
        state: "STARTED",
        attempt: 1,
        error_code: null,
        message: null,
        created_at: "2026-08-13T12:38:40.000Z",
      },
      "call-1",
    );
    expect(upload?.stage).toBe("UPLOADING");
    expect(transcribe?.stage).toBe("TRANSCRIBING");
    expect(transcribe?.state).toBe("started");
  });
});

describe("mapSnapshot", () => {
  it("reads a bare EventOut array", () => {
    const snapshot = mapSnapshot(
      [
        {
          id: "e1",
          stage: "TRANSCRIBING",
          state: "started",
          attempt: 1,
          error_code: null,
          message: "Transcribing",
          created_at: "2026-08-11T00:00:00.000Z",
        },
      ],
      "call-1",
      "TRANSCRIBING",
    );
    expect(snapshot.status).toBe("TRANSCRIBING");
    expect(snapshot.events[0]?.stage).toBe("TRANSCRIBING");
    expect(snapshot.callId).toBe("call-1");
  });
});

describe("mapReport", () => {
  it("maps snake_case sections and evidence_links", () => {
    const report = mapReport({
      call: toWireCall(demoCall),
      summary: { headline: "H", tldr: "T", detailed: "D", decisions: [], action_items: [], next_steps: [] },
      deal_signals: [{ id: "s1", label: "Next meeting", state: "missing" }],
      customer_truth: [
        {
          id: "f1",
          category: "pain",
          title: "Pain",
          summary: "Summary",
          evidence_status: "SUPPORTED",
          evidence_links: [{ transcript_segment_id: segmentId(14), sort_order: 0 }],
        },
      ],
      objections: [],
      commitments: [],
      risks: [],
      competitors: [],
      moments: [],
      reality_checks: [],
      next_call: { goal: "Book security", questions: [], prepare_for: [], do_not_forget: [], missing_fields: [] },
      manager_brief: {
        deal_label: "Deal",
        why_they_buy: "Pain",
        why_they_dont: [],
        intent: "Medium",
        competition: "None",
        biggest_risk: "Security",
        customer_commitment: "None",
        next_move: "Follow up",
      },
      buyer_sentiment: { overall: "neutral", trajectory: "flat", points: [], disclaimer: "Emotion is not buying intent." },
      buying_intent: { summary: "Mixed", signals: [] },
      metrics: {
        talk_ratio: { seller_pct: 55, customer_pct: 45 },
        longest_monologue: { speaker_name: "Rahul", duration_ms: 1000 },
        question_count: 4,
        keyword_hits: [],
      },
    });
    expect(report.customerTruth[0]?.evidence.segmentIds).toEqual([segmentId(14)]);
    expect(report.metrics.talkRatio.sellerPct).toBe(55);
    expect(report.nextCall.goal).toBe("Book security");
  });

  it("round-trips the demo report through snake_case", () => {
    const original = buildDemoReport();
    const mapped = mapReport(toWireReport(original));
    expect(mapped.objections.length).toBe(original.objections.length);
    expect(mapped.objections[0]?.evidence.segmentIds[0]).toBe(original.objections[0]?.evidence.segmentIds[0]);
  });
});

describe("live Prompt 2 payloads", () => {
  it("maps CallDetail with null optional fields", () => {
    const call = mapCall({
      id: "8a987e89-9466-4df9-8e1e-ea6dc2942fc6",
      public_call_id: "3ce95e93fe15",
      title: "UI integration probe",
      customer_name: "Example Probe",
      status: "CREATED",
      terminal_outcome: null,
      duration_ms: null,
      created_at: "2026-08-13T12:15:58.728843Z",
      updated_at: "2026-08-13T12:15:58.728851Z",
      rep_name: "Rahul",
      call_direction: "outbound",
      source_type: null,
      recording_mode: "mono",
      failure_kind: null,
      language: null,
      completed_at: null,
    });
    expect(call.durationMs).toBe(0);
    expect(call.language).toBe("en");
    expect(call.repName).toBe("Rahul");
    expect(call.sourceType).toBe("upload");
  });

  it("normalizes lowercase EventOut stage and SUCCEEDED state", () => {
    const snapshot = mapSnapshot(
      [
        {
          id: "c4bbf0d4-e2a7-4ca5-a20b-96cf48402b47",
          stage: "created",
          state: "SUCCEEDED",
          attempt: 1,
          error_code: null,
          message: null,
          created_at: "2026-08-13T12:15:58.736629Z",
        },
      ],
      "8a987e89-9466-4df9-8e1e-ea6dc2942fc6",
      "QUEUED",
    );
    expect(snapshot.events[0]?.stage).toBe("CREATED");
    expect(snapshot.events[0]?.state).toBe("succeeded");
    expect(snapshot.status).toBe("QUEUED");
  });

  it("maps follow-up sentences without subject or ids", () => {
    const email = mapFollowUp({
      sentences: [
        { text: "Hi Example Probe,", evidence_segment_ids: [], supported: false, kind: "NON_FACTUAL" },
      ],
      unsupported_claims: [],
      body: "Hi Example Probe,",
      polish: "fallback",
    });
    expect(email.subject).toBe("Follow-up");
    expect(email.sentences[0]?.kind).toBe("non_factual");
    expect(email.sentences[0]?.id).toBe("fu-0");
  });

  it("rewrites share URL onto the UI origin path", () => {
    const link = mapShareLink({
      id: "c5d5b604-4000-41f8-9aae-044a3fac60dc",
      token: "abc",
      expires_at: "2026-08-13T13:16:42.103362Z",
      url: "http://localhost:8000/api/v1/shared/abc",
    });
    expect(link.url).toBe("/shared/abc");
  });

  it("accepts share_token when token is omitted", () => {
    const link = mapShareLink({
      id: "share-1",
      share_token: "tok-99",
      url: "https://deal-truth-ngrok.ngrok-free.app/api/v1/shared/tok-99",
    });
    expect(link.token).toBe("tok-99");
    expect(link.url).toBe("/shared/tok-99");
  });
});

describe("mapSearchResponse", () => {
  it("maps a live snake_case segments payload", () => {
    const mapped = mapSearchResponse(
      {
        segments: [
          {
            id: "seg-1",
            call_id: "call-9",
            start_ms: 8000,
            end_ms: 12000,
            text: "that sounds good",
          },
        ],
      },
      "good",
    );
    expect(mapped.query).toBe("good");
    expect(mapped.groups.segments).toHaveLength(1);
    expect(mapped.groups.segments[0]).toMatchObject({
      kind: "segment",
      callId: "call-9",
      snippet: "that sounds good",
      startMs: 8000,
    });
    expect(mapped.groups.segments[0]?.evidence?.segmentIds).toEqual(["seg-1"]);
    expect(mapped.groups.calls).toHaveLength(1);
    expect(mapped.groups.calls[0]?.callId).toBe("call-9");
    expect(mapped.groups.segments[0]?.title).toBe("Transcript match");
    expect(mapped.total).toBe(2);
  });

  it("maps live grouped search with insight type and call id", () => {
    const mapped = mapSearchResponse({
      query: "security",
      groups: {
        insights: [{ id: "ins-1", type: "DEAL_RISK", title: "SOC2", summary: "review required", call_id: "c1" }],
        segments: [],
        calls: [{ id: "c1", title: "Discovery", customer_name: "Example Inc." }],
      },
      total: 2,
    });
    expect(mapped.groups.insights[0]?.insightType).toBe("DEAL_RISK");
    expect(mapped.groups.calls[0]?.callId).toBe("c1");
  });
});

describe("mapCall signal_pips object", () => {
  it("orders live dimension keys into the eight pip slots", () => {
    const call = mapCall({
      id: "c1",
      title: "Discovery",
      customer_name: "Example",
      status: "SHIPPED",
      duration_ms: 1000,
      created_at: "2026-08-11T00:00:00.000Z",
      updated_at: "2026-08-11T00:00:00.000Z",
      deal_id: "deal-1",
      top_risk: "No next meeting",
      signal_pips: {
        pain_identified: "proven",
        business_impact_identified: "proven",
        decision_maker_identified: "missing",
        economic_buyer_identified: "missing",
        timeline_identified: "missing",
        next_meeting_committed: "blocked",
        competitor_active: "blocked",
        blocker_active: "blocked",
      },
    });
    expect(call.dealId).toBe("deal-1");
    expect(call.biggestRisk).toBe("No next meeting");
    expect(call.signalPips).toEqual(["proven", "proven", "missing", "missing", "missing", "blocked", "blocked", "blocked"]);
  });
});

describe("mapRecommendations", () => {
  it("accepts snake_case call_ids and unknown kind values", () => {
    const mapped = mapRecommendations({
      available: true,
      items: [
        {
          id: "rec-1",
          kind: "objection",
          title: "Pricing",
          description: "Two calls",
          count: 2,
          query: "pricing",
          call_ids: ["a", "b"],
        },
      ],
    });
    expect(mapped.items[0]?.kind).toBe("aggregate_insight");
    expect(mapped.items[0]?.callIds).toEqual(["a", "b"]);
  });
});

describe("mapRefusals", () => {
  it("maps live refused claims", () => {
    const mapped = mapRefusals(
      {
        call_id: "c1",
        refused_count: 1,
        shipped_count: 23,
        refusals: [
          {
            id: "r1",
            insight_type: "CUSTOMER_FACT",
            title: "Budget approved",
            error_code: "EVIDENCE_UNSUPPORTED",
            drop_reason: "Not in the transcript",
          },
        ],
      },
      "c1",
    );
    expect(mapped.refusedCount).toBe(1);
    expect(mapped.refusals[0]?.code).toBe("EVIDENCE_UNSUPPORTED");
    expect(mapped.refusals[0]?.claim).toBe("Budget approved");
  });
});

describe("mapDeal", () => {
  it("maps dimension_states and sorts calls by created_at", () => {
    const deal = mapDeal({
      id: "deal-1",
      account_name: "Example Inc.",
      primary_contact: "Sarah",
      call_count: 2,
      span_days: 8,
      calls: [
        {
          call_id: "later",
          title: "Discovery",
          created_at: "2026-08-13T00:00:00.000Z",
          duration_ms: 1000,
          dimension_states: { pain_identified: "proven", next_meeting_committed: "blocked" },
        },
        {
          call_id: "earlier",
          title: "Intro",
          created_at: "2026-08-05T00:00:00.000Z",
          duration_ms: 800,
          dimension_states: { pain_identified: "proven", next_meeting_committed: "proven" },
        },
      ],
      deltas: [],
    });
    expect(deal.calls.map((call) => call.callId)).toEqual(["earlier", "later"]);
    expect(deal.calls[1]?.states.next_meeting_committed).toBe("blocked");
    expect(deal.accountName).toBe("Example Inc.");
  });
});

