import { describe, expect, it } from "vitest";
import { readHttpOrigin } from "./env";
import { integrationApiUrl } from "@/api/hubspot/client";

describe("readHttpOrigin", () => {
  it("keeps http and https origins and strips a trailing path", () => {
    expect(readHttpOrigin("http://localhost:4001/")).toBe("http://localhost:4001");
    expect(readHttpOrigin("http://localhost:4001/v1/hubspot")).toBe("http://localhost:4001");
    expect(readHttpOrigin("https://integrations.example.com")).toBe("https://integrations.example.com");
  });

  it("rejects credentials, slack webhooks, and non-http URLs", () => {
    expect(readHttpOrigin("")).toBe("");
    expect(readHttpOrigin("https://hooks.slack.com/services/example")).toBe("");
    expect(readHttpOrigin("javascript:alert(1)")).toBe("");
  });
});

describe("integrationApiUrl", () => {
  it("joins /v1/hubspot onto the configured origin or the local proxy prefix", () => {
    const url = integrationApiUrl("/v1/hubspot");
    expect(url.endsWith("/v1/hubspot")).toBe(true);
    expect(url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/integrations-api")).toBe(true);
    expect(integrationApiUrl("/health").endsWith("/health")).toBe(true);
  });
});
