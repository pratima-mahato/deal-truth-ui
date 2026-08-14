import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isReportReadyStatus, isTerminalStatus } from "@/api/contracts";
import { AudioPlayerProvider, useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { EvidenceFocusProvider, useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { CustomerTruthSection } from "@/features/customer-truth/CustomerTruthSection";
import { ObjectionsSection } from "@/features/objections/ObjectionsSection";
import { RealityCheckSection } from "@/features/reality-check/RealityCheckSection";
import { DealKillersSection } from "@/features/risks/DealKillersSection";
import { CommitmentLedger } from "@/features/commitments/CommitmentLedger";
import { BattlecardPanel } from "@/features/battlecard/BattlecardPanel";
import { ManagerBriefPanel } from "@/features/manager-brief/ManagerBriefPanel";
import { FollowUpPanel } from "@/features/follow-up/FollowUpPanel";
import { AskCallPanel } from "@/features/ask-call/AskCallPanel";
import { SentimentChart } from "@/features/sentiment/SentimentChart";
import { CompetitorsSection, MomentsTimeline } from "@/features/moments/MomentsAndCompetitors";
import { CallInfoView } from "@/features/workspace/CallInfoView";
import { InsightDrawer } from "@/features/workspace/InsightDrawer";
import { annotationsForReport } from "@/features/workspace/overviewModel";
import { ProofRing, SignalBoard } from "@/features/signals/ProofRing";
import { RefusedClaimsCard } from "@/features/gate/RefusedClaimsCard";
import { CrmSendDialog } from "@/features/integrations/CrmSendDialog";
import { proposeIntegrations } from "@/features/integrations/proposeActions";
import type { CallMoment, CallReport, Transcript } from "@/api/contracts";
import { DEMO_CLOSE_CRM, DEMO_OPEN_CRM, DEMO_PLAY_SEG, DEMO_SET_VIEW, protoSegToId } from "@/features/demo/demoEvents";
import { deriveDimensions } from "@/lib/evidence";
import { PlayGlyph } from "@/components/brand/ChakraMark";
import { StatusPill } from "@/components/ui/Badge";
import { formatDate, formatDuration } from "@/lib/utils";
import { CONNECTION_STATE, interpretIntegrationHealth } from "@/api/hubspot";
import { useAppIntegrations, useIntegrationHealth } from "@/hooks/useIntegrations";
import { useCall, useCallAudioSrc, useCallReport, useReanalyze, useShare, useSwapSpeakers, useTranscript } from "@/hooks/useCallApi";

const LANE_TICK_TARGET = 8;

function laneTicks(report: CallReport): CallMoment[] {
  return report.moments.slice(0, LANE_TICK_TARGET);
}

const VIEWS = [
  { id: "verdict", label: "Verdict" },
  { id: "record", label: "The record" },
  { id: "act", label: "What to do" },
  { id: "brief", label: "Manager brief" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function parseView(value?: string): ViewId {
  if (value === "overview" || value === "insights") return "verdict";
  if (value === "outline" || value === "transcript") return "record";
  if (value === "info") return "brief";
  return VIEWS.some((v) => v.id === value) ? (value as ViewId) : "verdict";
}

export function CallDetailPage({
  callId: callIdProp,
  readOnly = false,
}: {
  callId?: string;
  readOnly?: boolean;
}) {
  const params = useParams();
  const callId = callIdProp ?? params.callId ?? "";
  const call = useCall(callId);
  const audioSrc = useCallAudioSrc(callId);
  const ready = !!call.data && isReportReadyStatus(call.data.status);
  const report = useCallReport(callId, ready);
  const transcript = useTranscript(callId, ready);

  if (call.isLoading) return <PageSkeleton />;
  if (call.isError || !call.data) {
    return <ErrorState title="Call not found" description="This call is not available from the API." />;
  }
  if (!isTerminalStatus(call.data.status)) {
    return (
      <div className="page narrow">
        <div className="card pad">
          Still processing.{" "}
          <Link to={`/calls/${callId}/processing`} style={{ color: "var(--brand)", fontWeight: 700 }}>
            Watch processing stages
          </Link>
        </div>
      </div>
    );
  }
  if (call.data.status === "FAILED") {
    return (
      <ErrorState
        title="This call failed during processing"
        description={call.data.failureMessage ?? "Retry from the processing screen."}
      />
    );
  }
  if (call.data.status === "CANCELLED") {
    return (
      <ErrorState
        title="This call was cancelled"
        description="Processing stopped before a report was built. Upload again from the workspace."
      />
    );
  }
  if (report.isLoading || transcript.isLoading) return <PageSkeleton />;
  if (report.isError || !report.data || transcript.isError || !transcript.data) {
    return (
      <ErrorState
        title="Report is not ready"
        description="The call exists, but intelligence is unavailable."
        onRetry={() => void report.refetch()}
      />
    );
  }

  return (
    <EvidenceFocusProvider>
      <AudioPlayerProvider src={audioSrc} callDurationMs={call.data.durationMs}>
        <CallDetailBody
          callId={callId}
          readOnly={readOnly}
          report={report.data}
          transcript={transcript.data}
        />
      </AudioPlayerProvider>
    </EvidenceFocusProvider>
  );
}

function CallDetailBody({
  callId,
  readOnly,
  report,
  transcript,
}: {
  callId: string;
  readOnly: boolean;
  report: CallReport;
  transcript: Transcript;
}) {
  const [params] = useSearchParams();
  const { setFocus } = useEvidenceFocus();
  const { playFrom } = useAudioPlayer();
  const share = useShare(callId);
  const reanalyze = useReanalyze(callId);
  const swap = useSwapSpeakers(callId);
  const navigate = useNavigate();
  const [crmOpen, setCrmOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const unavailable = new Set(report.unavailableSections ?? []);
  const splat = useParams()["*"];
  const view = parseView(splat?.split("/")[0] || params.get("view") || undefined);
  const annotations = useMemo(() => annotationsForReport(report), [report]);
  const tiles = useMemo(() => deriveDimensions(report), [report]);
  const ticks = useMemo(() => laneTicks(report), [report]);

  const onShare = useCallback(() => {
    share.mutate(undefined, {
      onSuccess: (link) => {
        const url = `${window.location.origin}/shared/${link.token}`;
        setShareUrl(url);
        void navigator.clipboard.writeText(url);
      },
    });
  }, [share]);

  const setView = useCallback(
    (next: string) => {
      const qs = params.toString();
      navigate(`/calls/${callId}/${next}${qs ? `?${qs}` : ""}`, { replace: true });
    },
    [callId, navigate, params],
  );

  useEffect(() => {
    const segment = params.get("segment");
    if (segment) {
      setFocus({ segmentIds: [segment], play: params.get("play") === "1" });
    }
  }, [params, setFocus]);

  useEffect(() => {
    function onPlay(event: Event) {
      const proto = (event as CustomEvent<string>).detail;
      if (!proto) return;
      setFocus({ segmentIds: [protoSegToId(proto)], play: true });
    }
    function onCrm() {
      setCrmOpen(true);
    }
    function onCloseCrm() {
      setCrmOpen(false);
    }
    function onView(event: Event) {
      const next = (event as CustomEvent<string>).detail;
      if (next) setView(next);
    }
    window.addEventListener(DEMO_PLAY_SEG, onPlay);
    window.addEventListener(DEMO_OPEN_CRM, onCrm);
    window.addEventListener(DEMO_CLOSE_CRM, onCloseCrm);
    window.addEventListener(DEMO_SET_VIEW, onView);
    return () => {
      window.removeEventListener(DEMO_PLAY_SEG, onPlay);
      window.removeEventListener(DEMO_OPEN_CRM, onCrm);
      window.removeEventListener(DEMO_CLOSE_CRM, onCloseCrm);
      window.removeEventListener(DEMO_SET_VIEW, onView);
    };
  }, [callId, navigate, params, setFocus, setView]);

  return (
    <div className="page">
      <div className="between" style={{ marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="hstack" style={{ marginBottom: 5, flexWrap: "wrap" }}>
            <Link to="/" className="tiny" style={{ color: "var(--text-2)" }}>
              ← Calls
            </Link>
            <StatusPill status={report.call.status} />
            <span className="tiny mono">
              {formatDuration(report.call.durationMs)} · {formatDate(report.call.createdAt)} · {transcript.speakers.length} speakers
            </span>
          </div>
          <h1 className="serif" style={{ fontSize: 31, letterSpacing: "-.02em", lineHeight: 1.1 }}>
            {report.call.customerName.split("·")[1]?.trim() || report.call.customerName} — {report.call.title.toLowerCase()}
          </h1>
          <div className="sub" style={{ marginTop: 3 }}>
            {report.call.customerName} · {report.call.repName} (rep)
            {report.call.dealId ? (
              <>
                {" · "}
                <Link to={`/deals/${report.call.dealId}`} style={{ color: "var(--brand)", fontWeight: 700 }}>
                  see how this deal moved →
                </Link>
              </>
            ) : null}
          </div>
        </div>
        <div className="hstack" style={{ flexWrap: "wrap" }}>
          {!readOnly ? (
            <>
              <button type="button" className="btn sm" onClick={() => void swap.mutate()}>
                Swap speakers
              </button>
              <button type="button" className="btn sm" onClick={onShare}>
                Share
              </button>
              <button type="button" className="btn sm" onClick={() => setCrmOpen(true)}>
                Send to HubSpot
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={() =>
                  reanalyze.mutate(undefined, {
                    onSuccess: () => navigate(`/calls/${callId}/processing`),
                  })
                }
              >
                Re-analyse
              </button>
            </>
          ) : null}
          <button type="button" className="btn primary sm" onClick={() => void playFrom(0)}>
            <PlayGlyph />
            <span>Play evidence reel</span>
          </button>
        </div>
      </div>
      {shareUrl ? <p className="tiny" style={{ marginBottom: 10, color: "var(--proof)" }}>Share link copied.</p> : null}
      {report.call.status === "PARTIAL" || unavailable.size ? (
        <div
          className="card pad"
          style={{ marginBottom: 14, borderColor: "var(--unproven-line)", background: "var(--unproven-soft)" }}
        >
          <div className="eyebrow" style={{ marginBottom: 4 }}>Partial report</div>
          <div className="sub" style={{ fontSize: 12.5 }}>
            {unavailable.has("buyerSentiment")
              ? "Emotion analysis is temporarily unavailable — extraction and evidence are unaffected."
              : "Baseline summary unavailable — extraction and evidence are unaffected."}
            {unavailable.size ? ` Degraded: ${[...unavailable].join(", ")}.` : ""}
          </div>
        </div>
      ) : null}

      <div className="viewtabs" style={{ marginBottom: 16 }}>
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? "viewtab on" : "viewtab"}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="workspace">
        <div id="mainView">
          {view === "verdict" ? <VerdictView report={report} transcript={transcript} tiles={tiles} callId={callId} /> : null}
          {view === "record" ? (
            <RecordView report={report} transcript={transcript} unavailable={unavailable} callId={callId} />
          ) : null}
          {view === "act" ? (
            <ActView report={report} transcript={transcript} callId={callId} onCrm={() => setCrmOpen(true)} />
          ) : null}
          {view === "brief" ? (
            <BriefView report={report} tiles={tiles} callId={callId} onShare={onShare} />
          ) : null}
        </div>
        <aside className="rail">
          <AudioPlayer
            moments={ticks}
            transcript={transcript}
            seed={callId}
            talkRatio={report.metrics.talkRatio}
            onMomentClick={(moment) =>
              setFocus({ insightId: moment.id, segmentIds: moment.evidence.segmentIds, play: true })
            }
          />
          <TranscriptPanel transcript={transcript} readOnly={readOnly} annotations={annotations} callId={callId} />
        </aside>
      </div>

      <InsightDrawer onJumpToTranscript={() => setView("record")} />
      <CrmSendDialog open={crmOpen} onClose={() => setCrmOpen(false)} report={report} transcript={transcript} callId={callId} />
    </div>
  );
}

function VerdictCopy({ report }: { report: CallReport }) {
  const refusedMeeting = report.risks.some((risk) => /next meeting|next step/i.test(risk.title) && risk.evidenceStatus === "SUPPORTED");
  const security = report.risks.some((risk) => /security/i.test(risk.title) && risk.evidenceStatus === "SUPPORTED");
  const competitor = report.competitors.length > 0;
  const fit = /fit|intent|pain/i.test(`${report.summary.headline} ${report.buyingIntent.summary}`);
  if (fit && (security || competitor || refusedMeeting)) {
    return (
      <>
        Strong product fit.{" "}
        {security ? <span style={{ color: "var(--blocker)" }}>Blocked by a security review</span> : null}
        {competitor ? ", a live competitor" : null}
        {refusedMeeting ? (
          <>
            , and <span style={{ color: "var(--blocker)" }}>a next meeting the customer refused to book.</span>
          </>
        ) : (
          "."
        )}
      </>
    );
  }
  return <>{report.summary.tldr || report.summary.headline}</>;
}

function VerdictView({
  report,
  transcript,
  tiles,
  callId,
}: {
  report: CallReport;
  transcript: Transcript;
  tiles: ReturnType<typeof deriveDimensions>;
  callId: string;
}) {
  const { setFocus } = useEvidenceFocus();
  return (
    <div className="vstack" style={{ gap: 16 }}>
      <div className="card pad-lg reveal">
        <div className="eyebrow" style={{ marginBottom: 9 }}>
          The verdict
        </div>
        <div className="serif" style={{ fontSize: 27, lineHeight: 1.22, letterSpacing: "-.015em", maxWidth: "34ch" }}>
          <VerdictCopy report={report} />
        </div>
        <div className="hstack" style={{ marginTop: 14, flexWrap: "wrap" }}>
          {tiles.map((tile) => (
            <span
              key={tile.id}
              className={`chip ${tile.state === "proven" ? "proof" : tile.state === "missing" ? "absent" : "blocker"}`}
            >
              {tile.label}
            </span>
          ))}
        </div>
        <p className="invariant" style={{ marginTop: 14 }}>
          Every line below can be played back in the customer's own voice. No close probability — only what was observed.
        </p>
      </div>

      <div className="card pad-lg reveal">
        <div className="hstack" style={{ gap: 26, alignItems: "center", flexWrap: "wrap" }}>
          <ProofRing tiles={tiles} />
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <span className="h-sec">The eight dimensions</span>
              <span className="tiny">no close probability — only what was observed</span>
            </div>
            <SignalBoard
              tiles={tiles}
              onSelect={(tile) =>
                setFocus({
                  insightId: tile.id,
                  segmentIds: tile.segmentIds,
                  play: false,
                  drawer: { id: tile.id, title: tile.label, kind: "signal", why: tile.why },
                })
              }
            />
          </div>
        </div>
      </div>

      <RealityCheckSection checks={report.realityChecks} transcript={transcript} />
      <CustomerTruthSection facts={report.customerTruth} transcript={transcript} />
      <DealKillersSection risks={report.risks} transcript={transcript} />
      <RefusedClaimsCard callId={callId} />
    </div>
  );
}

function RecordView({
  report,
  transcript,
  unavailable,
  callId,
}: {
  report: CallReport;
  transcript: Transcript;
  unavailable: Set<string>;
  callId: string;
}) {
  return (
    <div className="vstack" style={{ gap: 16 }}>
      <MomentsTimeline moments={report.moments} durationMs={report.call.durationMs} />
      <SentimentChart
        sentiment={report.buyerSentiment}
        unavailable={unavailable.has("buyerSentiment")}
        transcript={transcript}
      />
      <div className="split">
        <ObjectionsSection objections={report.objections} transcript={transcript} />
        <div className="vstack" style={{ gap: 14 }}>
          <CompetitorsSection competitors={report.competitors} transcript={transcript} />
          <CallInfoView report={report} transcript={transcript} />
        </div>
      </div>
      <AskCallPanel callId={callId} />
    </div>
  );
}

function ActView({
  report,
  transcript,
  callId,
  onCrm,
}: {
  report: CallReport;
  transcript: Transcript;
  callId: string;
  onCrm: () => void;
}) {
  const proposed = proposeIntegrations(report);
  const health = useIntegrationHealth();
  const slackStatus = useAppIntegrations();
  const connections = interpretIntegrationHealth(health.data);
  const hubspotConnected = connections.hubspot === CONNECTION_STATE.CONNECTED;
  const slackConnected = slackStatus.data?.configured === true || connections.slack === CONNECTION_STATE.CONNECTED;
  return (
    <div className="vstack" style={{ gap: 16 }}>
      <div className="card pad-lg reveal">
        <div className="between" style={{ marginBottom: 10 }}>
          <span className="eyebrow">CRM & team actions</span>
          <span className="tiny">the gate applies to your pipeline too</span>
        </div>
        <div className="split">
          <div style={{ border: "1px solid var(--proof-line)", background: "var(--proof-soft)", borderRadius: 12, padding: "12px 14px" }}>
            <div className="between" style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>HubSpot</span>
              <span className={`chip ${hubspotConnected ? "proof" : ""}`}>
                {health.isLoading ? "Checking…" : hubspotConnected ? "Connected" : "Not configured"}
              </span>
            </div>
            <div className="sub" style={{ fontSize: 12.5, marginBottom: 10 }}>
              {proposed.crmActions.filter((action) => action.state === "SUPPORTED").length} fields carry evidence ·{" "}
              {proposed.crmActions.filter((action) => action.state === "MANUAL").length} need you ·{" "}
              <b style={{ color: "var(--blocker)" }}>
                {proposed.crmActions.filter((action) => action.state === "BLOCKED").length} refused
              </b>
            </div>
            <button type="button" className="btn sm primary" onClick={onCrm}>
              Send intelligence
            </button>
          </div>
          <div style={{ border: "1px solid var(--proof-line)", background: "var(--proof-soft)", borderRadius: 12, padding: "12px 14px" }}>
            <div className="between" style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>Slack</span>
              <span className={`chip ${slackConnected ? "proof" : ""}`}>
                {slackStatus.isLoading ? "Checking…" : slackConnected ? "Connected" : "Not configured"}
              </span>
            </div>
            <div className="sub" style={{ fontSize: 12.5, marginBottom: 10 }}>
              {proposed.slack.value}. Alerts fire from the integration service when a deal risk, refused claim, or lost
              dimension appears.
            </div>
            <Link to="/integrations" className="btn sm">
              View connection
            </Link>
          </div>
        </div>
      </div>
      <BattlecardPanel card={report.nextCall} transcript={transcript} commitments={report.commitments} />
      <CommitmentLedger commitments={report.commitments} transcript={transcript} />
      <FollowUpPanel callId={callId} initial={report.followUp} transcript={transcript} />
    </div>
  );
}

function BriefView({
  report,
  tiles,
  callId,
  onShare,
}: {
  report: CallReport;
  tiles: ReturnType<typeof deriveDimensions>;
  callId: string;
  onShare: () => void;
}) {
  return (
    <div className="vstack" style={{ gap: 16 }}>
      <ManagerBriefPanel
        brief={report.managerBrief}
        tiles={tiles}
        callId={callId}
        shippedCount={report.shippedCount}
        refusedCount={report.refusedCount}
      />
      <div className="card pad-lg reveal">
        <div className="h-sec" style={{ marginBottom: 11 }}>
          Deal signals at a glance
        </div>
        <SignalBoard tiles={tiles} />
      </div>
      <div className="card pad-lg reveal">
        <div className="between" style={{ marginBottom: 10 }}>
          <span className="h-sec">Share this report</span>
          <button type="button" className="btn sm primary" onClick={onShare}>
            Create link
          </button>
        </div>
        <div className="sub" style={{ fontSize: 12.5 }}>
          A read-only page with the evidence playable. Expires in 7 days, revocable any time. Nobody needs an account to
          open it.
        </div>
      </div>
    </div>
  );
}
