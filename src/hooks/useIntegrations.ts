import { useMutation, useQuery } from "@tanstack/react-query";
import { integrationApi, newIntegrationId, sanitizeSlackAlert } from "@/api/integrations";
import type { HubSpotOperation, HubSpotRequest, MockIntegrationScenario, SlackAlert } from "@/api/integrations/contracts";

export function useIntegrationHealth() {
  return useQuery({
    queryKey: ["integrations", "health"],
    queryFn: () => integrationApi.health(),
    retry: false,
    refetchInterval: 30_000,
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
