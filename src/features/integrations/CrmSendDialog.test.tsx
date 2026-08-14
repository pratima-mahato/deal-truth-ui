import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvidenceFocusProvider } from "@/components/evidence/EvidenceFocusContext";
import { buildAcmeReport } from "@/mocks/fixtures/acmeReport";
import { ACME_CALL_ID, buildAcmeTranscript } from "@/mocks/fixtures/acmeTranscript";
import { integrationApiUrl } from "@/api/hubspot/client";
import { CrmSendDialog } from "./CrmSendDialog";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CrmSendDialog", () => {
  it("approves summary-based HubSpot actions and posts them without secrets", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        requestId: "req-1",
        status: "SUCCESS",
        operations: [
          { operationId: "note_summary", type: "CREATE_NOTE", status: "SUCCESS", externalId: "1" },
        ],
        slack: { status: "SUCCESS" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EvidenceFocusProvider>
        <CrmSendDialog
          open
          onClose={() => undefined}
          report={buildAcmeReport()}
          transcript={buildAcmeTranscript()}
          callId={ACME_CALL_ID}
        />
      </EvidenceFocusProvider>,
    );

    expect(screen.getByText(/Write call notes/i)).toBeInTheDocument();
    expect(screen.getByText("Send SOC2 documentation")).toBeInTheDocument();
    expect(screen.getAllByText(/Log completed meeting/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Log completed meeting/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /Approve and send 5 HubSpot actions/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(integrationApiUrl("/v1/hubspot"));
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-API-Key")).toBeNull();
    const authorization = headers.get("Authorization");
    if (authorization) {
      expect(authorization.startsWith("Bearer ")).toBe(true);
    }
    const body = JSON.parse(String(init.body)) as {
      operations: Array<{ type: string }>;
      slack: { enabled: boolean; title: string };
    };
    expect(body.operations.map((operation) => operation.type)).toEqual([
      "CREATE_NOTE",
      "CREATE_TASK",
      "CREATE_TASK",
      "CREATE_TASK",
      "CREATE_CALL",
    ]);
    expect(body.slack.enabled).toBe(true);
    expect(body.slack.title).toBeTruthy();
    expect(JSON.stringify(body)).not.toMatch(/hooks\.slack\.com|privateApp|x-api-key|Bearer /i);
    expect(await screen.findByText(/HubSpot success/i)).toBeInTheDocument();
  });
});
