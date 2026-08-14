/** Presentation-mode events so the demo layer can drive the call workspace without importing it. */

export const DEMO_PLAY_SEG = "dt:play-seg";
export const DEMO_OPEN_CRM = "dt:open-crm";
export const DEMO_CLOSE_CRM = "dt:close-crm";
export const DEMO_SET_VIEW = "dt:set-view";

export function demoPlaySeg(protoId: string) {
  window.dispatchEvent(new CustomEvent(DEMO_PLAY_SEG, { detail: protoId }));
}

export function demoOpenCrm() {
  window.dispatchEvent(new Event(DEMO_OPEN_CRM));
}

export function demoCloseCrm() {
  window.dispatchEvent(new Event(DEMO_CLOSE_CRM));
}

export function demoSetView(view: string) {
  window.dispatchEvent(new CustomEvent(DEMO_SET_VIEW, { detail: view }));
}

export function protoSegToId(protoId: string): string {
  const n = Number(String(protoId).replace(/^sg/i, ""));
  return `00000000-0000-4000-8000-${String(Number.isFinite(n) ? n : 1).padStart(12, "0")}`;
}
