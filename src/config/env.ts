const DEFAULT_DEMO_CALL_ID = "call-demo";

function readFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function readRuntimeConfig(key: "apiBaseUrl" | "integrationApiBaseUrl"): string {
  if (typeof window === "undefined") return "";
  const fromRuntime = window.__APP_CONFIG__?.[key];
  if (typeof fromRuntime !== "string") return "";
  return fromRuntime.trim();
}

/** Origin only. Drops paths, credentials, and non-http URLs. */
export function readHttpOrigin(raw: string | undefined): string {
  const trimmed = stripTrailingSlash((raw ?? "").trim());
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.hostname === "hooks.slack.com") return "";
    return url.origin;
  } catch {
    return "";
  }
}

const apiBaseUrl =
  stripTrailingSlash(readRuntimeConfig("apiBaseUrl") || import.meta.env.VITE_API_BASE_URL || "");
const integrationApiBaseUrl = readHttpOrigin(
  readRuntimeConfig("integrationApiBaseUrl") || import.meta.env.VITE_INTEGRATION_API_BASE_URL,
);

export const env = {
  apiBaseUrl,
  integrationApiBaseUrl,
  useMocks: readFlag(import.meta.env.VITE_USE_MOCKS, !apiBaseUrl),
  useMockIntegrations: readFlag(import.meta.env.VITE_USE_MOCK_INTEGRATIONS, !integrationApiBaseUrl),
  demoCallId: import.meta.env.VITE_DEMO_CALL_ID || DEFAULT_DEMO_CALL_ID,
  apiKey: import.meta.env.VITE_API_KEY || "",
  integrationApiToken: import.meta.env.VITE_INTEGRATION_API_TOKEN || "",
  skipNgrokWarning: readFlag(
    import.meta.env.VITE_NGROK_SKIP_BROWSER_WARNING,
    apiBaseUrl.includes("ngrok") || integrationApiBaseUrl.includes("ngrok"),
  ),
} as const;
