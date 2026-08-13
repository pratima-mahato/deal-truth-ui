import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { env } from "@/config/env";
import { shouldRetryQuery } from "@/api/errors";
import { App } from "@/app/App";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
    },
  },
});

async function bootstrap() {
  if (env.useMocks) {
    const { enableMocks } = await import("@/mocks/enable");
    await enableMocks();
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
