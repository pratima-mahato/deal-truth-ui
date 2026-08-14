import { apiClient } from "../client";
import { asRecord } from "../adapters";
import type { SlackIntegrationStatus } from "../contracts";

export async function getAppIntegrations(): Promise<SlackIntegrationStatus> {
  const data = asRecord(await apiClient.get("/api/v1/integrations"));
  const slack = asRecord(data.slack);
  return { configured: Boolean(slack.configured) };
}

export async function configureSlackWebhook(webhookUrl: string): Promise<SlackIntegrationStatus> {
  const data = asRecord(
    await apiClient.post("/api/v1/integrations/slack", { webhook_url: webhookUrl }),
  );
  return { configured: Boolean(data.configured ?? asRecord(data.slack).configured) };
}
