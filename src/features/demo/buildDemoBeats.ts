import type { Call, CallRefusals, CallReport } from "@/api/contracts";
import { deriveDimensions } from "@/lib/evidence";
import { demoCloseCrm, demoOpenCrm, demoPlaySeg, demoSetView } from "./demoEvents";

export type DemoBeat = {
  cap: string;
  sub: string;
  go: () => void;
  spot: string | null;
  wait?: number;
};

export function buildDemoBeats({
  callCount,
  call,
  report,
  refusals,
  navigate,
}: {
  callCount: number;
  call?: Call;
  report?: CallReport;
  refusals?: CallRefusals;
  navigate: (to: string) => void;
}): DemoBeat[] {
  const callId = call?.id;
  const goCall = (view: string) => {
    if (callId) navigate(`/calls/${callId}/${view}`);
  };
  const tiles = report ? deriveDimensions(report) : [];
  const proven = tiles.filter((tile) => tile.state === "proven").length;
  const blocked = tiles.filter((tile) => tile.state === "blocked").length;
  const missing = tiles.filter((tile) => tile.state === "missing" || tile.state === "weak").length;
  const firstFact = report?.customerTruth.find((fact) => fact.evidence.segmentIds.length);
  const firstCheck = report?.realityChecks[0];
  const firstRisk = report?.risks[0];
  const playSeg = firstFact?.evidence.segmentIds[0] ?? firstCheck?.customerEvidence.segmentIds[0];

  const beats: DemoBeat[] = [
    {
      cap: "Deal Truth shows its receipts.",
      sub:
        callCount === 0
          ? "No calls are in the API yet. Upload a recording to analyze a real conversation."
          : `${callCount} call${callCount === 1 ? "" : "s"} loaded from the API. Every claim on screen is backed by a transcript segment.`,
      go: () => navigate("/"),
      spot: ".rows",
    },
  ];

  if (callId) {
    beats.push({
      cap: "Drop a call. Watch the gate work.",
      sub: call
        ? `${call.customerName || call.title} · ${call.status.replace(/_/g, " ").toLowerCase()}.`
        : "Processing events come from the API, not a progress bar.",
      go: () => navigate(`/calls/${callId}/processing`),
      spot: "#gatelog",
      wait: 1200,
    });
  }

  if (refusals && refusals.refusedCount > 0) {
    beats.push({
      cap: `${refusals.refusedCount} claim${refusals.refusedCount === 1 ? "" : "s"} never made it out.`,
      sub:
        refusals.refusals[0]?.why ||
        `${refusals.shippedCount} shipped with proof. Refused claims stay in the gate log.`,
      go: () => goCall("verdict"),
      spot: "#gatelog",
    });
  }

  if (report?.summary.headline) {
    beats.push({
      cap: "Here is the deal, in one sentence.",
      sub: report.summary.tldr || report.summary.headline,
      go: () => goCall("verdict"),
      spot: "#mainView .card",
    });
  }

  if (tiles.length) {
    beats.push({
      cap: `${tiles.length} dimensions. ${proven} proven. No invented score.`,
      sub: `${proven} stated · ${blocked} blocked · ${missing} never mentioned. Counts come from this call’s report.`,
      go: () => demoSetView("verdict"),
      spot: ".ring-wrap",
    });
  }

  if (firstFact) {
    beats.push({
      cap: firstFact.title,
      sub: firstFact.summary,
      go: () => {
        goCall("verdict");
        if (playSeg) window.setTimeout(() => demoPlaySeg(playSeg), 400);
      },
      spot: "#mainView .receipt",
    });
  }

  if (firstCheck) {
    beats.push({
      cap: firstCheck.title,
      sub: firstCheck.reason,
      go: () => {
        goCall("verdict");
        const seg = firstCheck.customerEvidence.segmentIds[0];
        if (seg) window.setTimeout(() => demoPlaySeg(seg), 400);
      },
      spot: ".reality",
    });
  }

  if (firstRisk) {
    beats.push({
      cap: firstRisk.title,
      sub: firstRisk.summary,
      go: () => goCall("verdict"),
      spot: "#mainView .card",
    });
  }

  if (report?.followUp || report?.nextCall) {
    beats.push({
      cap: "What to do next is built from the record.",
      sub: "The follow-up and battlecard only include what this report can evidence.",
      go: () => demoSetView("act"),
      spot: ".emailline",
    });
  }

  beats.push({
    cap: "The same gate can run on your CRM.",
    sub: "HubSpot writes are proposed from this report. Nothing is invented to fill a field.",
    go: () => {
      goCall("verdict");
      window.setTimeout(() => demoOpenCrm(), 300);
    },
    spot: "#crmModal",
  });

  if (call?.dealId) {
    beats.push({
      cap: "The deal timeline is the calls.",
      sub: "Open the deal that this call belongs to. Dimensions come from each call’s report.",
      go: () => {
        demoCloseCrm();
        navigate(`/deals/${call.dealId}`);
      },
      spot: ".matrix",
    });
  }

  beats.push({
    cap: "Deal Truth. Notes you can defend.",
    sub: callId
      ? "This walkthrough used the call and report returned by the API. Refresh and it loads the same records."
      : "Upload a recording. The demo uses whatever the API has — it does not ship a fake call.",
    go: () => (callId ? navigate(`/demo`) : navigate("/upload")),
    spot: null,
  });

  return beats;
}
