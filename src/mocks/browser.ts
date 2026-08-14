import { setupWorker } from "msw/browser";
import { env } from "@/config/env";
import { handlers, integrationHandlers } from "./handlers";

export const worker = setupWorker(
  ...(env.useMocks ? handlers : []),
  ...(env.useMockIntegrations ? integrationHandlers : []),
);
