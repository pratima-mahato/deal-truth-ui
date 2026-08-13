/** Deterministic UUID used by fixtures so evidence IDs stay stable across reloads. */
export function segmentId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}
