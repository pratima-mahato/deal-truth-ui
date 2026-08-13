import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvidenceFocusProvider, useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { EvidenceLink } from "@/components/evidence/EvidenceLink";
import { FollowUpPanel } from "@/features/follow-up/FollowUpPanel";
import { RealityCheckSection } from "@/features/reality-check/RealityCheckSection";
import { CustomerTruthSection } from "@/features/customer-truth/CustomerTruthSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { parseApiError, wrapFetchFailure } from "@/api/errors";
import { formatClock } from "@/lib/utils";
import { buildAcmeReport } from "@/mocks/fixtures/acmeReport";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

function Probe() {
  const { focus } = useEvidenceFocus();
  return <div data-testid="focus">{focus ? focus.segmentIds.join(",") : "none"}</div>;
}

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EvidenceFocusProvider>
          {ui}
        </EvidenceFocusProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("formatClock", () => {
  it("formats minutes and seconds", () => {
    expect(formatClock(1274000)).toBe("21:14");
  });
});

describe("parseApiError", () => {
  it("reads named error envelope", () => {
    const err = parseApiError(503, {
      error: { code: "ML_SERVICE_UNAVAILABLE", message: "down", retryable: true, failure_kind: "INFRASTRUCTURE" },
    });
    expect(err.code).toBe("ML_SERVICE_UNAVAILABLE");
    expect(err.retryable).toBe(true);
    expect(err.failureKind).toBe("INFRASTRUCTURE");
  });

  it("reads FastAPI 422 detail arrays", () => {
    const err = parseApiError(422, {
      detail: [{ type: "enum", loc: ["body", "call_direction"], msg: "Input should be inbound or outbound" }],
    });
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toMatch(/inbound/);
  });

  it("reads FastAPI 404 detail strings", () => {
    const err = parseApiError(404, { detail: "Not Found" });
    expect(err.code).toBe("NOT_FOUND");
  });

  it("maps untyped HTTP statuses to user-safe messages", () => {
    expect(parseApiError(401, {}).code).toBe("UNAUTHORIZED");
    expect(parseApiError(429, {}).retryable).toBe(true);
    expect(parseApiError(503, {}).message).toMatch(/temporarily unavailable/);
  });
});

describe("wrapFetchFailure", () => {
  it("maps AbortError to timeout", () => {
    const err = wrapFetchFailure(Object.assign(new Error("aborted"), { name: "AbortError" }));
    expect(err.code).toBe("TIMEOUT");
    expect(err.status).toBe(0);
    expect(err.retryable).toBe(true);
  });

  it("maps TypeError to network error", () => {
    const err = wrapFetchFailure(new TypeError("Failed to fetch"));
    expect(err.code).toBe("NETWORK_ERROR");
  });
});

describe("evidence flow", () => {
  it("Play evidence focuses the cited segment ids", async () => {
    const user = userEvent.setup();
    render(
      wrap(
        <>
          <EvidenceLink evidence={{ segmentIds: ["00000000-0000-4000-8000-000000000024"] }} insightId="obj-pricing" />
          <Probe />
        </>,
      ),
    );
    await user.click(screen.getByRole("button", { name: /play evidence/i }));
    expect(screen.getByTestId("focus")).toHaveTextContent("00000000-0000-4000-8000-000000000024");
  });
});

describe("follow-up", () => {
  it("shows unsupported claims and allows remove", async () => {
    const user = userEvent.setup();
    const report = buildAcmeReport();
    render(wrap(<FollowUpPanel callId="call-acme-saas-labs" initial={report.followUp} />));
    expect(screen.getByText(/looking forward to reconnecting next week/i)).toBeInTheDocument();
    expect(screen.getAllByText(/unsupported/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.queryByText(/looking forward to reconnecting next week/i)).not.toBeInTheDocument();
  });
});

describe("reality check", () => {
  it("renders seller and customer sides", () => {
    const report = buildAcmeReport();
    render(wrap(<RealityCheckSection checks={report.realityChecks} />));
    expect(screen.getAllByText(/seller implied/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/customer reality/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ready to purchase this month/i)).toBeInTheDocument();
  });
});

describe("customer truth", () => {
  it("shows unconfirmed timeline without a fake quote", () => {
    const report = buildAcmeReport();
    render(wrap(<CustomerTruthSection facts={report.customerTruth} />));
    expect(screen.getByText(/no evidence found/i)).toBeInTheDocument();
    expect(screen.queryByText(/84%/)).not.toBeInTheDocument();
  });
});

describe("infrastructure vs analysis", () => {
  it("does not treat named transcription errors as deal failure copy", () => {
    const err = parseApiError(502, {
      error: {
        code: "PYAI_JOB_FAILED",
        message: "Transcription failed",
        retryable: true,
      },
    });
    expect(err.code).toBe("PYAI_JOB_FAILED");
    expect(err.message).not.toMatch(/deal/i);
  });
});
