import { env } from "@/config/env";
import { integrationHttp } from "./client";
import type { HubSpotRequest, HubSpotResponse, IntegrationHealthResponse } from "./contracts";
import { mockExecuteHubSpot, mockIntegrationHealth } from "./mock";
import { parseHubSpotResponse } from "./response";

async function liveHealth(): Promise<IntegrationHealthResponse> {
  try {
    return await integrationHttp.get<IntegrationHealthResponse>("/v1/health");
  } catch {
    return await integrationHttp.get<IntegrationHealthResponse>("/health");
  }
}

export const integrationApi = {
  health(): Promise<IntegrationHealthResponse> {
    if (env.useMockIntegrations) return mockIntegrationHealth();
    return liveHealth();
  },

  async executeHubSpotOperations(request: HubSpotRequest): Promise<HubSpotResponse> {
    if (env.useMockIntegrations) {
      return mockExecuteHubSpot(request);
    }
    const raw = await integrationHttp.post<unknown>("/v1/sync", request);
    return parseHubSpotResponse(raw);
  },

  async sync(request: HubSpotRequest): Promise<HubSpotResponse> {
    if (env.useMockIntegrations) {
      return mockExecuteHubSpot(request);
    }
    const raw = await integrationHttp.post<unknown>("/v1/sync", request);
    return parseHubSpotResponse(raw);
  },
};

export type { HubSpotRequest, HubSpotResponse, IntegrationHealthResponse } from "./contracts";
export { summarizeHubSpotResponse, parseHubSpotResponse } from "./response";
export { newIntegrationId } from "./ids";
export { detectMockScenario } from "./mock";
export { slackIntegration, sanitizeSlackAlert, validateSlackWebhook, saveSlackWebhook } from "./slack";
