import { useEffect, useState } from "react";
import { env } from "@/config/env";

let demoReady = false;
const listeners = new Set<() => void>();

function snapshot() {
  return {
    demoMode: env.useMockIntegrations,
    demoConfigured: env.useMockIntegrations && demoReady,
  };
}

export function markDemoSlackConfigured(): void {
  if (!env.useMockIntegrations) return;
  demoReady = true;
  listeners.forEach((fn) => fn());
}

export function useSlackUiState() {
  const [state, setState] = useState(snapshot);
  useEffect(() => {
    const fn = () => setState(snapshot());
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return state;
}
