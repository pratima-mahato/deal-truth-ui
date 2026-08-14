import { env } from "@/config/env";
import type { SlackAlert } from "./contracts";

const WEBHOOK_PATTERN = /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+$/;

export function validateSlackWebhook(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Webhook URL is required.";
  if (!trimmed.startsWith("https://")) return "Webhook URL must use HTTPS.";
  if (!WEBHOOK_PATTERN.test(trimmed)) return "Enter a Slack incoming webhook URL.";
  return null;
}

/**
 * Future backend hook. The current integration API has no webhook-save endpoint.
 * The URL is never logged, stored in web storage, or sent to POST /v1/sync.
 */
export async function saveSlackWebhook(url: string): Promise<{ status: "unsupported" } | { status: "demo" }> {
  const error = validateSlackWebhook(url);
  if (error) throw new Error(error);
  if (!env.useMockIntegrations) {
    return { status: "unsupported" };
  }
  return { status: "demo" };
}

export function sanitizeSlackAlert(alert: SlackAlert): SlackAlert {
  const { webhookUrl: _ignored, ...safe } = alert as SlackAlert & { webhookUrl?: string };
  void _ignored;
  return {
    enabled: safe.enabled,
    type: safe.type,
    severity: safe.severity,
    title: safe.title,
    account: safe.account,
    message: safe.message,
    changes: safe.changes,
    risks: safe.risks,
    evidence: safe.evidence,
    reportUrl: safe.reportUrl,
  };
}

export const slackIntegration = {
  saveWebhook: saveSlackWebhook,
  validateWebhook: validateSlackWebhook,
};
