import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IntegrationsPage } from "./IntegrationsPage";
import { HUBSPOT_LOGO_URL, SLACK_LOGO_URL } from "@/features/integrations/IntegrationConnectionCard";
import { APP_INTEGRATIONS_QUERY_KEY, INTEGRATION_HEALTH_QUERY_KEY } from "@/hooks/useIntegrations";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(INTEGRATION_HEALTH_QUERY_KEY, {
    status: "ok",
    operations: ["CREATE_DEAL", "CREATE_NOTE", "CREATE_TASK", "CREATE_CALL", "CREATE_MEETING"],
  });
  client.setQueryData(APP_INTEGRATIONS_QUERY_KEY, { configured: true });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <IntegrationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("IntegrationsPage", () => {
  it("shows HubSpot and Slack as connected with brand logos and no setup fields", () => {
    renderPage();

    expect(screen.getAllByText("Connected").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("article", { name: /HubSpot Connected/i })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /Slack Connected/i })).toBeInTheDocument();
    expect(document.querySelector(`img[src="${HUBSPOT_LOGO_URL}"]`)).toBeTruthy();
    expect(document.querySelector(`img[src="${SLACK_LOGO_URL}"]`)).toBeTruthy();
    expect(screen.queryByLabelText(/webhook/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/hooks\.slack\.com/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
