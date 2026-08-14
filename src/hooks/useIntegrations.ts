import { useMutation, useQuery } from "@tanstack/react-query";
import { getHubspotHealth } from "@/api/hubspot";
import { integrationApi, newIntegrationId, sanitizeSlackAlert } from "@/api/integrations";
import type { HubSpotOperation, HubSpotRequest, MockIntegrationScenario, SlackAlert } from "@/api/integrations/contracts";

export const INTEGRATION_HEALTH_QUERY_KEY = ["integrations", "health"] as const;
const HEALTH_REFETCH_MS = 30_000;

export function useIntegrationHealth() {
  return useQuery({
    queryKey: INTEGRATION_HEALTH_QUERY_KEY,
    queryFn: getHubspotHealth,
    retry: false,
    refetchInterval: HEALTH_REFETCH_MS,
  });
}

export function useHubSpotExecution() {
  return useMutation({
    mutationFn: async (input: {
      operations: HubSpotOperation[];
      slack?: SlackAlert;
      scenario?: MockIntegrationScenario;
    }) => {
      const prefix = input.scenario && input.scenario !== "success" ? `${input.scenario}-` : "req-";
      const request: HubSpotRequest = {
        requestId: newIntegrationId(prefix.replace(/-$/, "")),
        operations: input.operations.map((op) => ({
          ...op,
          operationId: op.operationId || newIntegrationId("op"),
        })),
        slack: input.slack ? sanitizeSlackAlert(input.slack) : undefined,
      };
      return integrationApi.executeHubSpotOperations(request);
    },
  });
}

export function useRetryFailedOperations() {
  return useMutation({
    mutationFn: async (input: { operations: HubSpotOperation[]; slack?: SlackAlert }) => {
      const request: HubSpotRequest = {
        requestId: newIntegrationId("retry"),
        operations: input.operations,
        slack: input.slack ? sanitizeSlackAlert(input.slack) : undefined,
      };
      return integrationApi.executeHubSpotOperations(request);
    },
  });
}
