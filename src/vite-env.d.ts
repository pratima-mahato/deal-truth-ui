/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCKS: string;
  readonly VITE_DEMO_CALL_ID: string;
  readonly VITE_API_KEY: string;
  readonly VITE_INTEGRATION_API_BASE_URL: string;
  readonly VITE_INTEGRATION_API_TOKEN: string;
  readonly VITE_USE_MOCK_INTEGRATIONS: string;
  readonly VITE_NGROK_SKIP_BROWSER_WARNING: string;
  readonly VITE_INTEGRATION_API_BASE_URL: string;
  readonly VITE_USE_MOCK_INTEGRATIONS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface AppRuntimeConfig {
  readonly apiBaseUrl?: string;
  readonly integrationApiBaseUrl?: string;
}

interface Window {
  __APP_CONFIG__?: AppRuntimeConfig;
}
