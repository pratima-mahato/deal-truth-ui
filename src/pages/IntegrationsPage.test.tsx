import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { IntegrationsPage } from "./IntegrationsPage";
import { HUBSPOT_LOGO_URL, SLACK_LOGO_URL } from "@/features/integrations/IntegrationConnectionCard";

describe("IntegrationsPage", () => {
  it("shows HubSpot and Slack as connected with brand logos and no setup or health checks", () => {
    render(
      <MemoryRouter>
        <IntegrationsPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Connected").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("article", { name: /HubSpot Connected/i })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /Slack Connected/i })).toBeInTheDocument();
    expect(document.querySelector(`img[src="${HUBSPOT_LOGO_URL}"]`)).toBeTruthy();
    expect(document.querySelector(`img[src="${SLACK_LOGO_URL}"]`)).toBeTruthy();
    expect(screen.queryByText(/could not verify/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unreachable/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/webhook/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/hooks\.slack\.com/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
