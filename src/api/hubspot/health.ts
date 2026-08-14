import { HUBSPOT_OPERATION_TYPE } from "./constants";
import type { HubspotHealth } from "./types";

export const CONNECTION_STATE = {
  CHECKING: "checking",
  CONNECTED: "connected",
  UNAVAILABLE: "unavailable",
} as const;

export type ConnectionState = (typeof CONNECTION_STATE)[keyof typeof CONNECTION_STATE];

export const HEALTHY_SERVICE_STATUSES = ["ok", "healthy", "up", "ready", "operational"] as const;

const HEALTHY_STATUS_SET = new Set<string>(HEALTHY_SERVICE_STATUSES);

export const HUBSPOT_OPERATION_LABELS: Record<string, string> = {
  [HUBSPOT_OPERATION_TYPE.CREATE_DEAL]: "Deals",
  [HUBSPOT_OPERATION_TYPE.CREATE_NOTE]: "Notes",
  [HUBSPOT_OPERATION_TYPE.CREATE_TASK]: "Tasks",
  [HUBSPOT_OPERATION_TYPE.CREATE_CALL]: "Calls",
  [HUBSPOT_OPERATION_TYPE.CREATE_MEETING]: "Meetings",
};

export type IntegrationConnections = {
  service: ConnectionState;
  hubspot: ConnectionState;
  slack: ConnectionState;
};

const UNAVAILABLE: IntegrationConnections = {
  service: CONNECTION_STATE.UNAVAILABLE,
  hubspot: CONNECTION_STATE.UNAVAILABLE,
  slack: CONNECTION_STATE.UNAVAILABLE,
};

export const CHECKING_CONNECTIONS: IntegrationConnections = {
  service: CONNECTION_STATE.CHECKING,
  hubspot: CONNECTION_STATE.CHECKING,
  slack: CONNECTION_STATE.CHECKING,
};

export function isIntegrationServiceHealthy(status: string): boolean {
  return HEALTHY_STATUS_SET.has(status.trim().toLowerCase());
}

function hintConnected(hint?: { connected?: boolean; status?: string }): boolean | null {
  if (!hint) return null;
  if (typeof hint.connected === "boolean") return hint.connected;
  if (hint.status) return isIntegrationServiceHealthy(hint.status);
  return null;
}

export function interpretIntegrationHealth(health: HubspotHealth | undefined): IntegrationConnections {
  if (!health || !isIntegrationServiceHealthy(health.status)) return UNAVAILABLE;

  const hubspotHint = hintConnected(health.hubspot);
  const slackHint = hintConnected(health.slack);
  const advertisedOperations = health.operations == null || health.operations.length > 0;

  return {
    service: CONNECTION_STATE.CONNECTED,
    hubspot: hubspotHint === false || !advertisedOperations ? CONNECTION_STATE.UNAVAILABLE : CONNECTION_STATE.CONNECTED,
    slack: slackHint === false ? CONNECTION_STATE.UNAVAILABLE : CONNECTION_STATE.CONNECTED,
  };
}

export function hubspotCapabilityLabels(operations?: string[]): string[] {
  const source = operations?.length ? operations : Object.keys(HUBSPOT_OPERATION_LABELS);
  return source.map((operation) => HUBSPOT_OPERATION_LABELS[operation] ?? operation.replace(/^CREATE_/, "").toLowerCase());
}
