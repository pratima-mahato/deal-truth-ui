import { http, HttpResponse } from "msw";
import { mockStore } from "./store";
import {
  toWireAsk,
  toWireCall,
  toWireDeal,
  toWireEvents,
  toWireFollowUp,
  toWireInsights,
  toWireRefusals,
  toWireReport,
  toWireShare,
  toWireTranscript,
} from "./toWire";

function error(status: number, code: string, message: string, retryable = false) {
  return HttpResponse.json(
    { error: { code, message, retryable, details: {}, failure_kind: retryable ? "INFRASTRUCTURE" : undefined }, requestId: "mock" },
    { status },
  );
}

function notFound() {
  return error(404, "NOT_FOUND", "Call not found.");
}

function readCreateBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? ""),
    customerName: String(body.customer_name ?? body.customerName ?? ""),
    repName: String(body.rep_name ?? body.repName ?? ""),
    callDirection: (body.call_direction ?? body.callDirection ?? "outbound") as "inbound" | "outbound" | "internal" | "unknown",
  };
}

export const handlers = [
  http.get("/api/v1/calls/overview", () => HttpResponse.json(mockStore.overview())),

  http.get("/api/v1/calls", () => {
    return HttpResponse.json(mockStore.list().map(toWireCall));
  }),

  http.post("/api/v1/calls", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = readCreateBody(body);
    if (/\(sample\)/i.test(parsed.title)) {
      return HttpResponse.json(toWireCall(mockStore.loadSample()), { status: 201 });
    }
    return HttpResponse.json(toWireCall(mockStore.create(parsed)), { status: 201 });
  }),

  http.get("/api/v1/calls/:callId", ({ params }) => {
    try {
      return HttpResponse.json(toWireCall(mockStore.get(String(params.callId)).call));
    } catch {
      return notFound();
    }
  }),

  http.delete("/api/v1/calls/:callId", () => new HttpResponse(null, { status: 204 })),

  http.post("/api/v1/calls/:callId/audio", async ({ params, request }) => {
    try {
      await request.formData();
      return HttpResponse.json(toWireCall(mockStore.markUploaded(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.post("/api/v1/calls/:callId/source-url", async ({ params }) => {
    try {
      return HttpResponse.json(toWireCall(mockStore.markUploaded(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.post("/api/v1/calls/:callId/process", ({ params }) => {
    try {
      return HttpResponse.json(toWireCall(mockStore.startProcessing(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.post("/api/v1/calls/:callId/reanalyze", ({ params }) => {
    try {
      return HttpResponse.json(toWireCall(mockStore.retry(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.post("/api/v1/calls/:callId/cancel", ({ params }) => {
    try {
      return HttpResponse.json(toWireCall(mockStore.cancel(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/events", ({ params }) => {
    try {
      return HttpResponse.json(toWireEvents(mockStore.events(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/refusals", ({ params }) => {
    try {
      return HttpResponse.json(toWireRefusals(mockStore.refusals(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/audio-url", ({ params }) => {
    try {
      mockStore.get(String(params.callId));
      return HttpResponse.json({
        url: "/demo-audio.wav",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/stream", ({ params }) => {
    const callId = String(params.callId);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = () => {
          try {
            const snapshot = mockStore.events(callId);
            const payload = {
              call_id: snapshot.callId,
              status: snapshot.status,
              events: toWireEvents(snapshot),
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            if (
              snapshot.status === "SHIPPED" ||
              snapshot.status === "PARTIAL" ||
              snapshot.status === "FAILED" ||
              snapshot.status === "CANCELLED"
            ) {
              controller.close();
            }
          } catch {
            controller.close();
          }
        };
        send();
        const timer = setInterval(send, 1200);
        return () => clearInterval(timer);
      },
    });
    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }),

  http.get("/api/v1/calls/:callId/transcript", ({ params }) => {
    try {
      const record = mockStore.get(String(params.callId));
      if (!record.transcript) return error(409, "NOT_READY", "Transcript is not ready yet.", true);
      return HttpResponse.json(toWireTranscript(record.transcript));
    } catch {
      return notFound();
    }
  }),

  http.patch("/api/v1/calls/:callId/speakers", async ({ params, request }) => {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      const id = String(params.callId);
      const swapWith = body.swap_with ?? body.swapWith;
      const speakerId = String(body.speaker_id ?? body.speakerId ?? "");
      const displayName = body.display_name ?? body.displayName;
      if (swapWith) return HttpResponse.json(toWireTranscript(mockStore.swapSpeakers(id)));
      if (displayName && speakerId) {
        return HttpResponse.json(toWireTranscript(mockStore.renameSpeaker(id, speakerId, String(displayName))));
      }
      const transcript = mockStore.get(id).transcript;
      if (!transcript) return error(409, "NOT_READY", "Transcript is not ready yet.", true);
      return HttpResponse.json(toWireTranscript(transcript));
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/report", ({ params }) => {
    try {
      const record = mockStore.get(String(params.callId));
      if (!record.report) return error(409, "NOT_READY", "Report is not ready yet.", true);
      return HttpResponse.json(toWireReport(record.report));
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/insights", ({ params }) => {
    try {
      return HttpResponse.json(toWireInsights(mockStore.insights(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/metrics", ({ params }) => {
    try {
      const record = mockStore.get(String(params.callId));
      if (!record.report) return error(409, "NOT_READY", "Metrics are not ready yet.", true);
      const wired = toWireReport(record.report);
      return HttpResponse.json(wired.metrics ?? {});
    } catch {
      return notFound();
    }
  }),

  http.post("/api/v1/calls/:callId/ask", async ({ params, request }) => {
    try {
      const body = (await request.json()) as { question: string };
      return HttpResponse.json(toWireAsk(mockStore.ask(String(params.callId), body.question)));
    } catch {
      return notFound();
    }
  }),

  http.post("/api/v1/calls/:callId/follow-up", ({ params }) => {
    try {
      return HttpResponse.json(toWireFollowUp(mockStore.followUp(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.post("/api/v1/calls/:callId/share", ({ params }) => {
    try {
      return HttpResponse.json(toWireShare(mockStore.share(String(params.callId))));
    } catch {
      return notFound();
    }
  }),

  http.delete("/api/v1/calls/:callId/share/:shareId", () => new HttpResponse(null, { status: 204 })),

  http.get("/api/v1/shared/:token", ({ params }) => {
    try {
      const record = mockStore.byShareToken(String(params.token));
      return HttpResponse.json({
        report: toWireReport(record.report!),
        transcript: toWireTranscript(record.transcript!),
      });
    } catch {
      return error(404, "NOT_FOUND", "Share link is invalid or expired.");
    }
  }),

  http.get("/api/v1/calls/:callId/export/json", ({ params }) => {
    try {
      const record = mockStore.get(String(params.callId));
      return HttpResponse.json(record.report ? toWireReport(record.report) : toWireCall(record.call));
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/export/markdown", ({ params }) => {
    try {
      const record = mockStore.get(String(params.callId));
      const report = record.report;
      const md = report
        ? `# ${report.call.title}\n\n${report.summary.headline}\n\n${report.summary.tldr}\n`
        : `# ${record.call.title}\n`;
      return new HttpResponse(md, { headers: { "Content-Type": "text/markdown" } });
    } catch {
      return notFound();
    }
  }),

  http.get("/api/v1/calls/:callId/audio", async () => {
    const audio = await fetch("/demo-audio.wav");
    return new HttpResponse(await audio.arrayBuffer(), {
      headers: {
        "Content-Type": "audio/wav",
        "Accept-Ranges": "bytes",
      },
    });
  }),

  http.get("/api/v1/search", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return HttpResponse.json(mockStore.search(q));
  }),

  http.get("/api/v1/recommendations", () => HttpResponse.json(mockStore.recommendations())),

  http.get("/api/v1/deals/:dealId", ({ params }) => {
    try {
      return HttpResponse.json(toWireDeal(mockStore.deal(String(params.dealId))));
    } catch {
      return error(404, "NOT_FOUND", "Deal not found.");
    }
  }),

  http.get("/api/v1/integrations", () => HttpResponse.json({ slack: { configured: true } })),

  http.post("/api/v1/integrations/slack", async () => {
    return HttpResponse.json({ slack: { configured: true } });
  }),
];

function healthPayload() {
  return {
    status: "ok",
    operations: ["CREATE_DEAL", "CREATE_NOTE", "CREATE_TASK", "CREATE_CALL", "CREATE_MEETING"],
  };
}

async function mockHubspotSync({ request }: { request: Request }) {
  const body = (await request.json()) as {
    requestId?: string;
    operations?: Array<{ operationId?: string; type?: string; data?: Record<string, unknown> }>;
    slack?: { enabled?: boolean };
  };
  const operations = Array.isArray(body.operations) ? body.operations : [];
  return HttpResponse.json({
    requestId: body.requestId ?? "mock",
    status: "SUCCESS",
    operations: operations.map((operation, index) => ({
      operationId: operation.operationId ?? `op_${index}`,
      type: operation.type ?? "CREATE_NOTE",
      status: "SUCCESS",
      externalId: `mock-${index + 1}`,
      fields: operation.data ?? {},
    })),
    slack: { status: body.slack?.enabled ? "SUCCESS" : "SKIPPED" },
  });
}

export const integrationHandlers = [
  http.get("/integrations-api/health", () => HttpResponse.json(healthPayload())),
  http.get("/integrations-api/v1/health", () => HttpResponse.json(healthPayload())),
  http.post("/integrations-api/v1/hubspot", mockHubspotSync),
  http.post("/integrations-api/v1/sync", mockHubspotSync),
  http.get("*/v1/health", () => HttpResponse.json(healthPayload())),
  http.post("*/v1/hubspot", mockHubspotSync),
  http.post("*/v1/sync", mockHubspotSync),
];
