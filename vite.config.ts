import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const DEFAULT_HUBSPOT_ORIGIN = "http://localhost:4001";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const hubspotOrigin =
    stripTrailingSlash(fileEnv.VITE_INTEGRATION_API_BASE_URL || fileEnv.VITE_HUBSPOT_API_BASE_URL || "") ||
    DEFAULT_HUBSPOT_ORIGIN;
  const integrationToken = (fileEnv.INTEGRATION_API_TOKEN || fileEnv.VITE_INTEGRATION_API_TOKEN || "").trim();

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/integrations-api": {
          target: hubspotOrigin,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/integrations-api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (integrationToken) {
                proxyReq.setHeader("Authorization", `Bearer ${integrationToken}`);
              }
            });
          },
        },
      },
    },
  };
});
