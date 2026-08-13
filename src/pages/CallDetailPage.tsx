import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { callAudioUrl } from "@/api/endpoints/calls";
import { isReportReadyStatus, isTerminalStatus } from "@/api/contracts";
import { AudioPlayerProvider, useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { EvidenceFocusProvider, useEvidenceFocus } from "@/components/evidence/EvidenceFocusContext";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
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
import { OverviewStory } from "@/features/workspace/OverviewStory";
import { OutlineView } from "@/features/workspace/OutlineView";
import { CallInfoView } from "@/features/workspace/CallInfoView";
import { InsightDrawer } from "@/features/workspace/InsightDrawer";
import { annotationsForReport, buildOverviewModel } from "@/features/workspace/overviewModel";
import { useCall, useCallReport, useReanalyze, useShare, useSwapSpeakers, useTranscript } from "@/hooks/useCallApi";
import { formatDate, formatDuration } from "@/lib/utils";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "outline", label: "Outline" },
  { id: "transcript", label: "Transcript" },
  { id: "insights", label: "Insights" },
  { id: "info", label: "Call Info" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function parseView(value?: string): ViewId {
  return VIEWS.some((v) => v.id === value) ? (value as ViewId) : "overview";
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
  const ready = !!call.data && isReportReadyStatus(call.data.status);
  const report = useCallReport(callId, ready);
  const transcript = useTranscript(callId, ready);

  if (call.isLoading) return <PageSkeleton />;
  if (call.isError || !call.data) {
    return <ErrorState title="Call not found" description="This call is not available from the API." />;
  }
  if (!isTerminalStatus(call.data.status)) {
    return (
      <Alert tone="info" title="Still processing">
        <Link to={`/calls/${callId}/processing`} className="underline">
          Watch processing stages
        </Link>
      </Alert>
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
      <AudioPlayerProvider src={callAudioUrl(callId)} callDurationMs={call.data.durationMs}>
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
  report: NonNullable<ReturnType<typeof useCallReport>["data"]>;
  transcript: NonNullable<ReturnType<typeof useTranscript>["data"]>;
}) {
  const [params] = useSearchParams();
  const { setFocus } = useEvidenceFocus();
  const { playFrom } = useAudioPlayer();
  const share = useShare(callId);
  const reanalyze = useReanalyze(callId);
  const swap = useSwapSpeakers(callId);
  const navigate = useNavigate();
  const [swapOpen, setSwapOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const unavailable = new Set(report.unavailableSections ?? []);
  const splat = useParams()["*"];
  const view = parseView(splat?.split("/")[0] || params.get("view") || undefined);
  const model = useMemo(() => buildOverviewModel(report, transcript), [report, transcript]);
  const annotations = useMemo(() => annotationsForReport(report), [report]);

  function setView(next: string) {
    const qs = params.toString();
    navigate(`/calls/${callId}/${next}${qs ? `?${qs}` : ""}`, { replace: true });
  }

  useEffect(() => {
    const segment = params.get("segment");
    if (segment) {
      setFocus({ segmentIds: [segment], play: params.get("play") === "1" });
      if (view !== "transcript") {
        setView("transcript");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("segment"), params.get("play")]);

  return (
    <div className="pb-8">
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <Link to="/" className="text-sm text-ink-500 hover:text-ink-900">
            <span className="inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Calls
            </span>
          </Link>
          <span className="text-ink-200">·</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight text-ink-900">
                {report.call.customerName}
              </h1>
              <StatusPill status={report.call.status} />
            </div>
            <p className="text-sm text-ink-500">
              {report.call.title} · {formatDate(report.call.createdAt)} · {formatDuration(report.call.durationMs)} ·{" "}
              {transcript.speakers.length} participants
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => void playFrom(0)}>
            <Play className="h-4 w-4" />
            Play call
          </Button>
          {!readOnly ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setSwapOpen(true)}>
                Swap speakers
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  share.mutate(undefined, {
                    onSuccess: (link) => {
                      const url = `${window.location.origin}/shared/${link.token}`;
                      setShareUrl(url);
                      void navigator.clipboard.writeText(url);
                    },
                  })
                }
              >
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  reanalyze.mutate(undefined, {
                    onSuccess: () => navigate(`/calls/${callId}/processing`),
                  })
                }
              >
                Reanalyze
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {report.call.status === "PARTIAL" ? (
        <div className="mb-4">
          <Alert tone="warning" title="Partial report">
            {report.call.failureMessage ?? "Some intelligence sections are unavailable. Available evidence still ships."}
          </Alert>
        </div>
      ) : null}
      {shareUrl ? <p className="mb-3 text-xs text-emerald-800">Share link copied: {shareUrl}</p> : null}

      <div className="mb-5">
        <Tabs tabs={[...VIEWS]} value={view} onChange={setView} />
      </div>

      {view === "overview" ? <OverviewStory model={model} /> : null}
      {view === "outline" ? (
        <OutlineView sections={model.outline} durationMs={report.call.durationMs} transcript={transcript} />
      ) : null}
      {view === "transcript" ? (
        <Card className="p-4">
          <TranscriptPanel transcript={transcript} readOnly={readOnly} annotations={annotations} />
        </Card>
      ) : null}
      {view === "insights" ? (
        <div className="space-y-5">
          <CustomerTruthSection facts={report.customerTruth} />
          <ObjectionsSection objections={report.objections} />
          <RealityCheckSection checks={report.realityChecks} />
          <CommitmentLedger commitments={report.commitments} />
          <DealKillersSection risks={report.risks} />
          <CompetitorsSection competitors={report.competitors} />
          <MomentsTimeline moments={report.moments} />
          <BattlecardPanel card={report.nextCall} />
          <ManagerBriefPanel brief={report.managerBrief} />
          <FollowUpPanel callId={callId} initial={report.followUp} />
          <AskCallPanel callId={callId} />
          <SentimentChart sentiment={report.buyerSentiment} unavailable={unavailable.has("buyerSentiment")} />
        </div>
      ) : null}
      {view === "info" ? <CallInfoView report={report} transcript={transcript} /> : null}

      <div className="sticky bottom-4 z-20 mt-6">
        <AudioPlayer
          moments={report.moments}
          transcript={transcript}
          seed={callId}
          onMomentClick={(moment) =>
            setFocus({ insightId: moment.id, segmentIds: moment.evidence.segmentIds, play: true })
          }
        />
      </div>

      <InsightDrawer onJumpToTranscript={() => setView("transcript")} />

      <Modal
        open={swapOpen}
        title="Swap seller and customer?"
        onClose={() => setSwapOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSwapOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                swap.mutate(undefined, {
                  onSuccess: () => {
                    setSwapOpen(false);
                    navigate(`/calls/${callId}/processing`);
                  },
                })
              }
            >
              Swap and reanalyze
            </Button>
          </>
        }
      >
        Changing roles invalidates customer-only insights and queues a new analysis. The original transcript is kept.
      </Modal>
    </div>
  );
}
