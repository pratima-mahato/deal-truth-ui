import { env } from "@/config/env";
import { isTerminalStatus, type ProcessingSnapshot } from "./contracts";
import { getProcessingSnapshot } from "./endpoints/calls";

export type Unsubscribe = () => void;

/**
 * Subscribe to processing updates.
 * Always polls `/events` + `/calls/{id}` (source of truth).
 * Live SSE uses `event: processing` (not the default `message` event);
 * those frames wake the poller immediately.
 */
export function subscribeProcessing(
  callId: string,
  onSnapshot: (snapshot: ProcessingSnapshot) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  let stopped = false;
  let source: EventSource | null = null;
  let pollTimer: number | null = null;
  let inFlight = false;

  function stop(): void {
    stopped = true;
    source?.close();
    source = null;
    if (pollTimer != null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function deliver(snapshot: ProcessingSnapshot): void {
    if (stopped) return;
    onSnapshot(snapshot);
    if (isTerminalStatus(snapshot.status)) stop();
  }

  async function poll(): Promise<void> {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const snapshot = await getProcessingSnapshot(callId);
      deliver(snapshot);
    } catch (error) {
      if (!stopped) onError?.(error);
    } finally {
      inFlight = false;
    }
  }

  function startPolling(): void {
    if (stopped || pollTimer != null) return;
    void poll();
    pollTimer = window.setInterval(() => {
      if (!stopped) void poll();
    }, 1500);
  }

  try {
    const url = new URL(`${env.apiBaseUrl}/api/v1/calls/${callId}/stream`, window.location.origin);
    if (env.skipNgrokWarning) url.searchParams.set("ngrok-skip-browser-warning", "true");
    source = new EventSource(url.toString());
    const wake = () => {
      void poll();
    };
    source.onmessage = wake;
    source.addEventListener("processing", wake);
    source.onerror = () => {
      source?.close();
      source = null;
      if (stopped) return;
      window.setTimeout(() => {
        if (stopped || source) return;
        try {
          source = new EventSource(url.toString());
          source.onmessage = wake;
          source.addEventListener("processing", wake);
        } catch {
          /* poller remains the floor */
        }
      }, 2000);
    };
  } catch {
    // Polling below is enough when EventSource cannot start.
  }

  startPolling();

  return () => stop();
}
