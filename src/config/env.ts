function readFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export const env = {
  apiBaseUrl,
  useMocks: readFlag(import.meta.env.VITE_USE_MOCKS, !apiBaseUrl),
  demoCallId: import.meta.env.VITE_DEMO_CALL_ID || "call-acme-saas-labs",
  apiKey: import.meta.env.VITE_API_KEY || "",
  skipNgrokWarning: readFlag(
    import.meta.env.VITE_NGROK_SKIP_BROWSER_WARNING,
    apiBaseUrl.includes("ngrok"),
  ),
} as const;
