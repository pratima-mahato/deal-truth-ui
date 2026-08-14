#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../design/prototype.html", import.meta.url), "utf8");
const { window } = new JSDOM(html);
const SEL = {
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

const counts = Object.fromEntries(
  Object.entries(SEL).map(([key, sel]) => [key, window.document.querySelectorAll(sel).length]),
);
const existing = JSON.parse(readFileSync(new URL("../design/parity-manifest.json", import.meta.url), "utf8"));
existing.generatedFrom = "design/prototype.html";
existing._staticCounts = counts;
writeFileSync(new URL("../design/parity-manifest.json", import.meta.url), JSON.stringify(existing, null, 1) + "\n");
console.log("Wrote static counts (prototype is JS-rendered; keep screen counts from the live prototype):");
console.log(counts);
