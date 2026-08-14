import { describe, expect, it } from "vitest";
import {
  CONNECTION_STATE,
  hubspotCapabilityLabels,
  interpretIntegrationHealth,
  isIntegrationServiceHealthy,
} from "./health";

describe("isIntegrationServiceHealthy", () => {
  it("accepts the live health status", () => {
    expect(isIntegrationServiceHealthy("ok")).toBe(true);
    expect(isIntegrationServiceHealthy("OK")).toBe(true);
    expect(isIntegrationServiceHealthy("down")).toBe(false);
  });
});

describe("interpretIntegrationHealth", () => {
  it("marks HubSpot and Slack connected from the live /health payload", () => {
    const connections = interpretIntegrationHealth({
      status: "ok",
      operations: ["CREATE_DEAL", "CREATE_NOTE", "CREATE_TASK", "CREATE_CALL", "CREATE_MEETING"],
    });
    expect(connections).toEqual({
      service: CONNECTION_STATE.CONNECTED,
      hubspot: CONNECTION_STATE.CONNECTED,
      slack: CONNECTION_STATE.CONNECTED,
    });
  });

  it("honors explicit disconnected hints without inventing client setup", () => {
    expect(
      interpretIntegrationHealth({
        status: "ok",
        operations: ["CREATE_NOTE"],
        slack: { connected: false },
      }).slack,
    ).toBe(CONNECTION_STATE.UNAVAILABLE);
    expect(
      interpretIntegrationHealth({
        status: "ok",
        operations: ["CREATE_NOTE"],
        hubspot: { connected: false },
      }).hubspot,
    ).toBe(CONNECTION_STATE.UNAVAILABLE);
  });

  it("treats a missing or unhealthy payload as unreachable", () => {
    expect(interpretIntegrationHealth(undefined).service).toBe(CONNECTION_STATE.UNAVAILABLE);
    expect(interpretIntegrationHealth({ status: "error" }).hubspot).toBe(CONNECTION_STATE.UNAVAILABLE);
  });
});

describe("hubspotCapabilityLabels", () => {
  it("maps advertised operations to display labels", () => {
    expect(hubspotCapabilityLabels(["CREATE_DEAL", "CREATE_NOTE"])).toEqual(["Deals", "Notes"]);
  });
});
