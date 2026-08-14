import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../design/parity-manifest.json"), "utf8"),
) as {
  screens: Record<string, { counts: Record<string, number> }>;
  tokens: Record<string, Record<string, string>>;
};

const SEL: Record<string, string> = {
  cards: ".card",
  receipts: ".receipt",
  stamps: ".stamp",
  chips: ".chip",
  signalTiles: ".sig",
  realityChecks: ".reality",
  proofRing: ".ring-wrap",
  transcriptSegments: ".seg",
  evidencePlayButtons: ".btn.play",
  emailLines: ".emailline",
  matrixCells: ".matrix .cell",
  gateLogRows: ".gl-row",
  waveBars: "#waveMain b",
  momentTicks: ".lane-tick",
};

const EXACT = new Set([
  "signalTiles",
  "realityChecks",
  "proofRing",
  "transcriptSegments",
  "matrixCells",
  "emailLines",
  "waveBars",
  "momentTicks",
]);
const TOLERANCE = 0.25;

const CALL = "call-acme-saas-labs";
const ROUTES: Record<string, string> = {
  workspace: "/",
  search: "/search",
  upload: "/upload",
  "call:verdict": `/calls/${CALL}/verdict`,
  "call:moments": `/calls/${CALL}/record`,
  "call:act": `/calls/${CALL}/act`,
  "call:brief": `/calls/${CALL}/brief`,
  processing: `/calls/${CALL}/processing`,
  deal: "/deals/acme",
  integrations: "/integrations",
};

for (const [screen, expected] of Object.entries(manifest.screens)) {
  const path = ROUTES[screen];
  if (!path) continue;

  test(`parity · ${screen}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const misses: string[] = [];
    for (const [key, want] of Object.entries((expected as { counts: Record<string, number> }).counts)) {
      const selector = SEL[key];
      if (!selector) continue;
      const got = await page.locator(selector).count();
      const ok = EXACT.has(key) ? got === want : got >= Math.floor((want as number) * (1 - TOLERANCE));
      if (!ok) misses.push(`${key}: expected ${EXACT.has(key) ? "" : ">="}${want}, got ${got}`);
    }
    expect(misses, `\n${screen} drifted from the prototype:\n  ${misses.join("\n  ")}\n`).toEqual([]);
  });
}

test("invariant · no close probability anywhere", async ({ page }) => {
  await page.goto(`/calls/${CALL}/verdict`);
  const text = await page.locator("#root").innerText();
  expect(text).not.toMatch(/\b\d{1,3}\s?%|\blikelihood\b|\bprobability\b|\/\s?100\b/i);
});

test("invariant · both themes expose every token", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
    const got = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return Object.fromEntries(
        ["--canvas", "--surface", "--line", "--text", "--brand", "--proof", "--unproven", "--blocker", "--absent"].map(
          (k) => [k, cs.getPropertyValue(k).trim()],
        ),
      );
    });
    for (const [k, v] of Object.entries((manifest.tokens as Record<string, Record<string, string>>)[theme])) {
      if (got[k] !== undefined) expect(got[k], `${theme} ${k}`).toBe(v);
    }
  }
});
