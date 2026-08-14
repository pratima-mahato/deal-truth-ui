import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HTTPS_REQUIRED_MESSAGE } from "@/features/ingest/constants";

const mutate = vi.fn();
const uploadState = {
  isPending: false,
  isError: false,
  error: null as Error | null,
  mutate,
};

vi.mock("@/hooks/useCallApi", () => ({
  useUploadFlow: () => uploadState,
}));

import { UploadPage } from "./UploadPage";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("UploadPage", () => {
  beforeEach(() => {
    mutate.mockReset();
    uploadState.isPending = false;
    uploadState.isError = false;
    uploadState.error = null;
  });

  it("keeps a single analyse CTA and three cards", () => {
    const { container } = renderPage();
    expect(container.querySelectorAll(".card").length).toBe(3);
    expect(screen.getAllByRole("button", { name: /analyse call/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /analyse call/i })).toBeDisabled();
  });

  it("requires HTTPS for the link source", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /https link/i }));
    const input = screen.getByLabelText(/recording url/i);
    await user.type(input, "http://files.example.com/call.mp3");
    await user.tab();
    expect(screen.getByRole("alert")).toHaveTextContent(HTTPS_REQUIRED_MESSAGE);
    expect(screen.getByRole("button", { name: /analyse call/i })).toBeDisabled();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("shows an API failure once in the shared alert", () => {
    uploadState.isError = true;
    uploadState.error = new Error("Upload failed.");
    renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed.");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
