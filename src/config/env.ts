const DEFAULT_DEMO_CALL_ID = "call-acme-saas-labs";

function readFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function readRuntimeApiBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const fromRuntime = window.__APP_CONFIG__?.apiBaseUrl;
  if (typeof fromRuntime !== "string") return "";
  return stripTrailingSlash(fromRuntime.trim());
}

const apiBaseUrl =
  readRuntimeApiBaseUrl() || stripTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? "");

export const env = {
  apiBaseUrl,
  useMocks: readFlag(import.meta.env.VITE_USE_MOCKS, !apiBaseUrl),
  demoCallId: import.meta.env.VITE_DEMO_CALL_ID || DEFAULT_DEMO_CALL_ID,
  apiKey: import.meta.env.VITE_API_KEY || "",
  skipNgrokWarning: readFlag(
    import.meta.env.VITE_NGROK_SKIP_BROWSER_WARNING,
    apiBaseUrl.includes("ngrok"),
  ),
} as const;
