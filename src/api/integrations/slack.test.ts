import { describe, expect, it } from "vitest";
import { sanitizeSlackAlert, validateSlackWebhook } from "@/api/integrations/slack";
import type { SlackAlert } from "@/api/integrations/contracts";

describe("validateSlackWebhook", () => {
  it("requires an HTTPS Slack incoming webhook URL", () => {
    expect(validateSlackWebhook("")).toBe("Webhook URL is required.");
    expect(validateSlackWebhook("http://hooks.slack.com/services/T000/B000/X")).toBe("Webhook URL must use HTTPS.");
    expect(validateSlackWebhook("https://example.com/hook")).toBe("Enter a Slack incoming webhook URL.");
    expect(validateSlackWebhook("https://hooks.slack.com/services/T000/B000/XXXX")).toBeNull();
  });
});

describe("sanitizeSlackAlert", () => {
  it("never forwards a webhook URL on the Slack payload", () => {
    const alert = {
      enabled: true,
      type: "DEAL_RISK",
      severity: "critical",
      title: "Deal risk detected",
      webhookUrl: "https://hooks.slack.com/services/T000/B000/XXXX",
    } as SlackAlert & { webhookUrl: string };
    const safe = sanitizeSlackAlert(alert);
    expect("webhookUrl" in safe).toBe(false);
    expect(JSON.stringify(safe)).not.toMatch(/hooks\.slack\.com/);
    expect(safe.type).toBe("DEAL_RISK");
  });
});
