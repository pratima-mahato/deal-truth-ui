/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCKS: string;
  readonly VITE_DEMO_CALL_ID: string;
  readonly VITE_API_KEY: string;
  readonly VITE_NGROK_SKIP_BROWSER_WARNING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
