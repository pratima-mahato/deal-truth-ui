import { describe, expect, it } from "vitest";
import { hubspotSyncRequestSchema } from "@/api/hubspot/types";
import { FORBIDDEN_REQUEST_KEYS, HUBSPOT_OPERATION_TYPE, HUBSPOT_TASK_TYPE } from "@/api/hubspot/constants";
import { buildAcmeReport } from "@/mocks/fixtures/acmeReport";
import { buildAcmeTranscript } from "@/mocks/fixtures/acmeTranscript";
import {
  buildDealOperation,
  dateInputToDateTime,
  inferTaskType,
  parseDueAt,
  proposeIntegrations,
} from "./proposeActions";

function collectKeys(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }
  if (!value || typeof value !== "object") return keys;
  for (const [key, nested] of Object.entries(value)) {
    keys.push(key);
    collectKeys(nested, keys);
  }
  return keys;
}

describe("parseDueAt", () => {
  const from = "2026-08-11T15:04:00.000Z";

  it("maps tomorrow, Friday, and next week to timezone datetimes", () => {
    expect(parseDueAt("Tomorrow", from)).toBe("2026-08-12T15:04:00.000Z");
    expect(parseDueAt("Friday", from)).toBe("2026-08-14T15:04:00.000Z");
    expect(parseDueAt("Next week", from)).toBe("2026-08-18T15:04:00.000Z");
  });

  it("never returns a date-only value", () => {
    expect(parseDueAt("by Friday", from)).toMatch(/T.*Z$/);
  });
});

describe("inferTaskType", () => {
  it("uses EMAIL for documentation sends and CALL for intros", () => {
    expect(inferTaskType("Send SOC2 documentation")).toBe(HUBSPOT_TASK_TYPE.EMAIL);
    expect(inferTaskType("Introduce security lead")).toBe(HUBSPOT_TASK_TYPE.CALL);
    expect(inferTaskType("Internal recap")).toBe(HUBSPOT_TASK_TYPE.TODO);
  });
});

describe("proposeIntegrations", () => {
  const report = buildAcmeReport();
  const transcript = buildAcmeTranscript();
  const proposed = proposeIntegrations(report, {
    reportUrl: "http://localhost:5173/calls/call-acme-saas-labs",
    transcript,
  });

  it("proposes note, seller tasks, and a completed call from the summary", () => {
    const types = proposed.crmActions.filter((action) => action.state === "SUPPORTED").map((action) => action.type);
    expect(types).toEqual([
      HUBSPOT_OPERATION_TYPE.CREATE_NOTE,
      HUBSPOT_OPERATION_TYPE.CREATE_TASK,
      HUBSPOT_OPERATION_TYPE.CREATE_TASK,
      HUBSPOT_OPERATION_TYPE.CREATE_TASK,
      HUBSPOT_OPERATION_TYPE.CREATE_CALL,
    ]);
    expect(proposed.crmActions.find((action) => action.type === HUBSPOT_OPERATION_TYPE.CREATE_TASK)?.value).toMatch(/SOC2/i);
  });

  it("leaves deal amount manual and blocks a next meeting nobody booked", () => {
    const deal = proposed.crmActions.find((action) => action.type === HUBSPOT_OPERATION_TYPE.CREATE_DEAL);
    const meeting = proposed.crmActions.find((action) => action.type === HUBSPOT_OPERATION_TYPE.CREATE_MEETING);
    expect(deal?.state).toBe("MANUAL");
    expect(deal?.defaultSelected).toBe(false);
    expect(meeting?.state).toBe("BLOCKED");
    expect(meeting?.operation).toBeUndefined();
  });

  it("builds a valid HubSpot request with Slack deal-risk, without secrets", () => {
    const operations = proposed.crmActions
      .filter((action) => action.defaultSelected && action.operation)
      .map((action) => action.operation!);
    const parsed = hubspotSyncRequestSchema.parse({
      requestId: "dealtruth_acme_test",
      operations,
      slack: proposed.slack.slack,
    });
    expect(parsed.slack?.enabled).toBe(true);
    expect(parsed.slack?.type).toBe("DEAL_RISK");
    expect(parsed.slack?.title).toMatch(/economic buyer|next meeting/i);
    expect(parsed.slack?.evidence?.length).toBeGreaterThan(0);
    const keys = collectKeys(parsed).map((key) => key.toLowerCase());
    for (const forbidden of FORBIDDEN_REQUEST_KEYS) {
      expect(keys).not.toContain(forbidden.toLowerCase());
    }
    expect(JSON.stringify(parsed)).not.toMatch(/hooks\.slack\.com/i);
  });
});

describe("buildDealOperation", () => {
  it("converts a date-only close date to a timezone datetime", () => {
    expect(dateInputToDateTime("2026-10-31")).toBe("2026-10-31T00:00:00.000Z");
    const deal = buildDealOperation({
      name: "Acme — ops routing",
      pipeline: "default",
      stage: "appointmentscheduled",
      amount: 120000,
      closeDate: "2026-10-31",
    });
    expect(deal?.data).toMatchObject({
      name: "Acme — ops routing",
      amount: 120000,
      closeDate: "2026-10-31T00:00:00.000Z",
    });
  });

  it("omits the deal until required fields are present", () => {
    expect(
      buildDealOperation({
        name: "Acme",
        pipeline: "default",
        stage: "appointmentscheduled",
        amount: Number.NaN,
        closeDate: "",
      }),
    ).toBeUndefined();
  });
});
