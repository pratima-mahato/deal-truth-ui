import { describe, expect, it } from "vitest";
import { buildAcmeReport, acmeCall } from "@/mocks/fixtures/acmeReport";
import { buildAcmeTranscript } from "@/mocks/fixtures/acmeTranscript";
import {
  buildDraftFromIntelligence,
  composeOperations,
  requiredFieldErrors,
} from "@/features/integrations/buildOperations";
import { mockExecuteHubSpot, detectMockScenario } from "@/api/integrations/mock";
import { parseHubSpotResponse, summarizeHubSpotResponse } from "@/api/integrations/response";
import type { HubSpotRequest } from "@/api/integrations/contracts";

describe("buildDraftFromIntelligence", () => {
  it("maps Acme intelligence without fabricating evidence quotes", () => {
    const report = buildAcmeReport();
    const transcript = buildAcmeTranscript();
    const draft = buildDraftFromIntelligence(report, transcript, "https://app.example/calls/acme/overview");

    expect(draft.deal.name).toMatch(/Acme/i);
    expect(draft.note.body).toContain("Salesforce");
    expect(draft.task.subject.length).toBeGreaterThan(0);
    expect(draft.call.title).toBe(acmeCall.title);
    expect(draft.call.durationMs).toBe(acmeCall.durationMs);
    expect(draft.selected.meeting).toBe(false);
    expect(draft.omissions.some((item) => /meeting/i.test(item))).toBe(true);

    expect(draft.slack.type).toBe("DEAL_RISK");
    expect(draft.slack.evidence?.length).toBeGreaterThan(0);
    const segmentTexts = transcript.segments.map((seg) => seg.text.trim());
    for (const item of draft.slack.evidence ?? []) {
      expect(segmentTexts).toContain(item.quote);
    }
    expect(draft.slack.reportUrl).toContain("/calls/");
  });

  it("composeOperations emits unique ids and ISO timestamps", () => {
    const report = buildAcmeReport();
    const draft = buildDraftFromIntelligence(report, buildAcmeTranscript());
    draft.deal.amount = 800;
    const ops = composeOperations(draft);
    const ids = ops.map((op) => op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ops.some((op) => op.type === "CREATE_DEAL")).toBe(true);
    expect(ops.some((op) => op.type === "CREATE_NOTE")).toBe(true);
    expect(ops.some((op) => op.type === "CREATE_TASK")).toBe(true);
    expect(ops.some((op) => op.type === "CREATE_MEETING")).toBe(false);
    const callOp = ops.find((op) => op.type === "CREATE_CALL");
    expect(callOp?.type === "CREATE_CALL" && callOp.data.timestamp.endsWith("Z")).toBe(true);
    expect(requiredFieldErrors(draft)).toEqual([]);
  });
});

describe("HubSpot response interpretation", () => {
  it("treats mixed operation statuses as PARTIAL", () => {
    const parsed = parseHubSpotResponse({
      status: "SUCCESS",
      operations: [
        { operationId: "a", type: "CREATE_DEAL", status: "SUCCESS", entityUrl: "https://app.hubspot.com/deal/1" },
        { operationId: "b", type: "CREATE_NOTE", status: "SUCCESS" },
        { operationId: "c", type: "CREATE_TASK", status: "FAILED", error: { message: "Could not create task." } },
      ],
      slack: { status: "SKIPPED" },
    });
    const summary = summarizeHubSpotResponse(parsed);
    expect(summary.succeeded).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.overall).toBe("PARTIAL");
    expect(parsed.slack?.status).toBe("SKIPPED");
  });
});

describe("mock integration scenarios", () => {
  const baseOps: HubSpotRequest["operations"] = [
    { operationId: "deal-1", type: "CREATE_DEAL", data: { name: "Acme", pipeline: "default", stage: "appointmentscheduled", amount: 1, closeDate: "2026-10-31T00:00:00.000Z" } },
    { operationId: "note-1", type: "CREATE_NOTE", data: { body: "Summary" } },
    { operationId: "task-1", type: "CREATE_TASK", data: { taskType: "TODO", dueAt: "2026-08-20T00:00:00.000Z", subject: "Follow up" } },
  ];

  it("success + slack success", async () => {
    const res = await mockExecuteHubSpot({
      requestId: "req-1",
      operations: baseOps,
      slack: { enabled: true, type: "deal_risk", severity: "critical", title: "Risk" },
    });
    expect(res.status).toBe("SUCCESS");
    expect(res.operations.every((op) => op.status === "SUCCESS")).toBe(true);
    expect(res.operations[0]?.entityUrl).toMatch(/hubspot\.com/);
    expect(res.slack?.status).toBe("SUCCESS");
  });

  it("partial: task fails", async () => {
    const res = await mockExecuteHubSpot({
      requestId: "partial-1",
      operations: baseOps,
      slack: { enabled: true, type: "crm_updated", severity: "info", title: "CRM" },
    });
    expect(detectMockScenario({ requestId: "partial-1", operations: baseOps })).toBe("partial");
    expect(res.status).toBe("PARTIAL");
    expect(res.operations.find((op) => op.type === "CREATE_TASK")?.status).toBe("FAILED");
    expect(res.operations.filter((op) => op.status === "SUCCESS")).toHaveLength(2);
  });

  it("all fail", async () => {
    const res = await mockExecuteHubSpot({ requestId: "fail-1", operations: baseOps });
    expect(res.status).toBe("FAILED");
    expect(res.operations.every((op) => op.status === "FAILED")).toBe(true);
  });

  it("slack skipped when disabled", async () => {
    const res = await mockExecuteHubSpot({
      requestId: "req-2",
      operations: baseOps,
      slack: { enabled: false, type: "general", severity: "info", title: "Skip" },
    });
    expect(res.slack?.status).toBe("SKIPPED");
    expect(res.status).toBe("SUCCESS");
  });

  it("slack failure does not roll back CRM", async () => {
    const res = await mockExecuteHubSpot({
      requestId: "slack-fail-1",
      operations: baseOps,
      slack: { enabled: true, type: "deal_risk", severity: "warning", title: "Risk" },
    });
    expect(res.status).toBe("SUCCESS");
    expect(res.operations.every((op) => op.status === "SUCCESS")).toBe(true);
    expect(res.slack?.status).toBe("FAILED");
    expect(res.slack?.message).toMatch(/not rolled back/i);
  });
});
