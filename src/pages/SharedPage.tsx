import { useParams } from "react-router-dom";
import { CallDetailPage } from "./CallDetailPage";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { EvidenceFocusProvider } from "@/components/evidence/EvidenceFocusContext";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import { callAudioUrl } from "@/api/endpoints/calls";
import { useSharedReport } from "@/hooks/useCallApi";
import { DealSignalStrip } from "@/features/calls/DealSignalStrip";
import { CustomerTruthSection } from "@/features/customer-truth/CustomerTruthSection";
import { ObjectionsSection } from "@/features/objections/ObjectionsSection";
import { RealityCheckSection } from "@/features/reality-check/RealityCheckSection";
import { DealKillersSection } from "@/features/risks/DealKillersSection";
import { CommitmentLedger } from "@/features/commitments/CommitmentLedger";
import { BattlecardPanel } from "@/features/battlecard/BattlecardPanel";
import { ManagerBriefPanel } from "@/features/manager-brief/ManagerBriefPanel";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/Badge";
import { userFacingMessage } from "@/api/errors";
import { formatDate, formatDuration, resolveCallDurationMs } from "@/lib/utils";

export function SharedPage() {
  const params = useParams();
  const token = (() => {
    const raw = params.token ?? "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  const shared = useSharedReport(token);

  if (shared.isLoading) return <PageSkeleton />;
  if (shared.isError || !shared.data) {
    return (
      <ErrorState
        title="Share link invalid"
        description={userFacingMessage(
          shared.error,
          "This report is missing, expired, revoked, or not ready yet.",
        )}
      />
    );
  }

  const { report, transcript } = shared.data;

  return (
    <EvidenceFocusProvider>
      <AudioPlayerProvider src={callAudioUrl(report.call.id)} callDurationMs={resolveCallDurationMs(report.call.durationMs, transcript)}>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Shared report · read only</p>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words text-xl font-semibold sm:text-2xl">{report.call.title}</h1>
            <StatusPill status={report.call.status} />
          </div>
          <p className="mb-4 text-sm text-slate-500">
            {report.call.customerName} · {formatDate(report.call.createdAt)} · {formatDuration(resolveCallDurationMs(report.call.durationMs, transcript))}
          </p>
          <div className="mb-5">
            <DealSignalStrip signals={report.dealSignals} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-5">
              <Card className="p-5">
                <h2 className="text-base font-semibold">Overview</h2>
                <p className="mt-2 text-lg font-medium">{report.summary.headline}</p>
                <p className="mt-2 text-sm text-slate-600">{report.summary.tldr}</p>
              </Card>
              <CustomerTruthSection facts={report.customerTruth} />
              <ObjectionsSection objections={report.objections} />
              <RealityCheckSection checks={report.realityChecks} />
              <CommitmentLedger commitments={report.commitments} />
              <DealKillersSection risks={report.risks} />
              <BattlecardPanel card={report.nextCall} />
              <ManagerBriefPanel brief={report.managerBrief} />
            </div>
            <aside className="space-y-4 lg:sticky lg:top-20">
              <AudioPlayer />
              <Card className="p-4">
                <h2 className="mb-3 text-sm font-semibold">Transcript</h2>
                <TranscriptPanel transcript={transcript} readOnly />
              </Card>
            </aside>
          </div>
        </div>
      </AudioPlayerProvider>
    </EvidenceFocusProvider>
  );
}

import { env } from "@/config/env";

export function DemoPage() {
  if (!env.useMocks) {
    return (
      <ErrorState
        title="Demo fixture is mock-only"
        description="The flagship sample lives in MSW. Upload a recording on the workspace to analyze a real call against Prompt 2."
      />
    );
  }
  return <CallDetailPage callId={env.demoCallId} />;
}
