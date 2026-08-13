import { describe, expect, it } from "vitest";
import { mapCall, mapCallList, mapEvent, mapEvidence, mapFollowUp, mapReport, mapShareLink, mapSnapshot, mapTranscript } from "@/api/adapters";
import { toWireCall, toWireTranscript, toWireReport } from "@/mocks/toWire";
import { buildAcmeTranscript } from "@/mocks/fixtures/acmeTranscript";
import { acmeCall, buildAcmeReport } from "@/mocks/fixtures/acmeReport";
import { segmentId } from "@/lib/segmentId";

describe("mapCallList", () => {
  it("wraps a bare CallSummary array", () => {
    const listed = mapCallList([
      {
        id: "11111111-1111-4111-8111-111111111111",
        public_call_id: "pub-1",
        title: "Discovery",
        customer_name: "Acme",
        status: "SHIPPED",
        terminal_outcome: "SHIPPED",
        duration_ms: 120000,
        created_at: "2026-08-11T00:00:00.000Z",
        updated_at: "2026-08-11T00:10:00.000Z",
      },
    ]);
    expect(listed.total).toBe(1);
    expect(listed.items[0]?.customerName).toBe("Acme");
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

  it("round-trips the Acme fixture through wire shape", () => {
    const original = buildAcmeTranscript();
    const mapped = mapTranscript(toWireTranscript(original));
    expect(mapped.segments[0]?.id).toBe(original.segments[0]?.id);
    expect(mapped.segments).toHaveLength(original.segments.length);
    expect(mapped.text).toContain("Sounds good");
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
      call: toWireCall(acmeCall),
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

  it("round-trips the Acme report through snake_case", () => {
    const original = buildAcmeReport();
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
      customer_name: "Acme Probe",
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
        { text: "Hi Acme Probe,", evidence_segment_ids: [], supported: false, kind: "NON_FACTUAL" },
      ],
      unsupported_claims: [],
      body: "Hi Acme Probe,",
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
});
