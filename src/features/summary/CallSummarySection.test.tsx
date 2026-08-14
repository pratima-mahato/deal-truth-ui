import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CallSummarySection } from "./CallSummarySection";
import { isSummaryUnavailable, partialReportMessage } from "./partialReport";
import { buildDemoReport } from "@/mocks/fixtures/demoReport";
import { deriveDimensions } from "@/lib/evidence";
import type { Summary } from "@/api/contracts";

const emptySummary: Summary = {
  headline: "",
  tldr: "",
  detailed: "",
  decisions: [],
  actionItems: [],
  nextSteps: [],
};

describe("partialReportMessage", () => {
  it("returns null when the report is complete", () => {
    expect(partialReportMessage([], false)).toBeNull();
  });

  it("names emotion degradation without claiming the summary is missing", () => {
    const message = partialReportMessage(["buyerSentiment"], true);
    expect(message).toMatch(/Emotion analysis/i);
    expect(message).not.toMatch(/Baseline summary unavailable/i);
  });

  it("names leftover sections instead of a false summary outage", () => {
    const message = partialReportMessage(["outline"], true);
    expect(message).toMatch(/Degraded: outline/);
    expect(message).not.toMatch(/Baseline summary unavailable/i);
  });
});

describe("CallSummarySection", () => {
  it("renders headline, tldr, detailed recap, and the three lists", async () => {
    const user = userEvent.setup();
    const report = buildDemoReport();
    render(<CallSummarySection summary={report.summary} tiles={deriveDimensions(report)} />);

    expect(screen.getByText("The verdict")).toBeInTheDocument();
    expect(screen.getByText(report.summary.headline)).toBeInTheDocument();
    expect(screen.getByText(report.summary.tldr)).toBeInTheDocument();
    expect(screen.getByText(report.summary.decisions[0])).toBeInTheDocument();
    expect(screen.getByText(report.summary.actionItems[0])).toBeInTheDocument();
    expect(screen.getByText(report.summary.nextSteps[0])).toBeInTheDocument();

    const recap = screen.getByText("Detailed recap").closest("details");
    expect(recap).not.toHaveAttribute("open");
    await user.click(screen.getByText("Detailed recap"));
    expect(recap).toHaveAttribute("open");
    expect(screen.getByText(report.summary.detailed)).toBeVisible();
    expect(screen.getByText(/no close probability/i)).toBeInTheDocument();
  });

  it("shows absent copy when lists are empty", () => {
    render(
      <CallSummarySection
        summary={{ ...emptySummary, headline: "Quiet call.", tldr: "Nothing committed." }}
        tiles={[]}
      />,
    );
    expect(screen.getAllByText("None stated on this call")).toHaveLength(3);
    expect(screen.queryByText("Detailed recap")).not.toBeInTheDocument();
  });

  it("does not crash when the recap is degraded", () => {
    expect(isSummaryUnavailable(["recap"])).toBe(true);
    render(
      <CallSummarySection summary={emptySummary} tiles={[]} unavailable={["summary"]} />,
    );
    expect(screen.getByText(/Baseline summary unavailable/i)).toBeInTheDocument();
    expect(screen.getAllByText("None stated on this call")).toHaveLength(3);
  });
});
