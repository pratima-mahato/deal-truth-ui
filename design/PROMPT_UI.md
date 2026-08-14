# PROMPT — `deal-truth-ui`

> Paste this whole file as your first message in Cursor / Claude Code with `deal-truth-ui` open.
>
> **Work one task at a time. After each task, run its Validate command and show me the output before starting the next. If a Validate command fails, fix it before continuing — never proceed past a failing check.**

## Context

You are rebuilding the Deal Truth web app to match a finished HTML prototype.

- `design/prototype.html` — the visual source of truth. Open it. Everything you build must match it.
- `design/UI_DESIGN_SPEC.md` — tokens, component specs, screen-by-screen layouts, data bindings to real API fields.
- `design/UI_CHANGES.md` — file-by-file notes on the existing code.
- `design/parity-manifest.json` — machine-extracted fingerprint of the prototype. Your tests assert against it.

Stack: React 18.3 · Vite 7 · Tailwind 3.4 · react-router 7 · TanStack Query 5 · zod · MSW · Vitest · Playwright.

**The product invariant, which governs every decision:**
> No proof in the transcript, no claim in the report.

Three rules you may never break:
1. **No close probability.** No 0–100 score, no %, no "likelihood". Only observed dimensions: proven / blocked / not found.
2. **Absence is a result.** "The customer never gave a timeline" renders as a dashed, muted finding — not an empty state, never a guess.
3. **Quotes are verbatim transcript text**, resolved from `segment_ids`. Never model prose in quotation marks.

**Critical constraint that makes parity testable:** use the exact class names from the prototype on your components — `.card`, `.receipt`, `.stamp`, `.chip`, `.sig`, `.reality`, `.ring-wrap`, `.seg`, `.btn.play`, `.emailline`, `.matrix .cell`, `.gl-row`, `#waveMain b`, `.lane-tick`. Treat them as the component contract. Add your own classes alongside; do not rename these.

---

## Task 1 — Land the design assets and the check gate

**Goal:** the target and the scoring function both live in the repo, so "does it match?" stops being a matter of opinion.

**Change**
- Ensure `design/prototype.html`, `design/parity-manifest.json`, `design/UI_DESIGN_SPEC.md`, `design/UI_CHANGES.md` are committed.
- Add to `package.json` scripts: `"design"`, `"parity": "playwright test e2e/parity.spec.ts"`, `"check": "npm run typecheck && npm run lint && npm test && npm run parity"`.
- Add a pre-push hook running `npm run check`.

**Validate**
```bash
test -f design/prototype.html && test -f design/parity-manifest.json && \
node -e "const s=require('./package.json').scripts; if(!s.check||!s.parity) process.exit(1)" && echo PASS
```

**Done when:** prints `PASS`.

---

## Task 2 — Build the parity harness

**Goal:** a single command tells you how far the React app is from the prototype, per screen. This is the instrument you will use for every remaining task.

**Change** — create `e2e/parity.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import manifest from '../design/parity-manifest.json';

const SEL: Record<string, string> = {
  cards: '.card', receipts: '.receipt', stamps: '.stamp', chips: '.chip',
  signalTiles: '.sig', realityChecks: '.reality', proofRing: '.ring-wrap',
  transcriptSegments: '.seg', evidencePlayButtons: '.btn.play',
  emailLines: '.emailline', matrixCells: '.matrix .cell', gateLogRows: '.gl-row',
  waveBars: '#waveMain b', momentTicks: '.lane-tick',
};

// Structural counts must match exactly — they encode the data model.
const EXACT = new Set([
  'signalTiles', 'realityChecks', 'proofRing', 'transcriptSegments',
  'matrixCells', 'emailLines', 'waveBars', 'momentTicks',
]);
// Decorative counts get ±25% — chip and card counts shift with copy edits.
const TOLERANCE = 0.25;

const CALL = 'call-acme-saas-labs';
const ROUTES: Record<string, string> = {
  workspace: '/', search: '/search', upload: '/upload',
  'call:verdict': `/calls/${CALL}/verdict`,
  'call:moments': `/calls/${CALL}/record`,
  'call:act': `/calls/${CALL}/act`,
  'call:brief': `/calls/${CALL}/brief`,
  deal: '/deals/acme', integrations: '/integrations',
};

for (const [screen, expected] of Object.entries(manifest.screens)) {
  const path = ROUTES[screen];
  if (!path) continue;

  test(`parity · ${screen}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const misses: string[] = [];
    for (const [key, want] of Object.entries((expected as any).counts)) {
      const got = await page.locator(SEL[key]).count();
      const ok = EXACT.has(key)
        ? got === want
        : got >= Math.floor((want as number) * (1 - TOLERANCE));
      if (!ok) misses.push(`${key}: expected ${EXACT.has(key) ? '' : '>='}${want}, got ${got}`);
    }
    expect(misses, `\n${screen} drifted from the prototype:\n  ${misses.join('\n  ')}\n`).toEqual([]);
  });
}

test('invariant · no close probability anywhere', async ({ page }) => {
  await page.goto(`/calls/${CALL}/verdict`);
  const text = await page.locator('#root').innerText();
  expect(text).not.toMatch(/\b\d{1,3}\s?%|\blikelihood\b|\bprobability\b|\/\s?100\b/i);
});

test('invariant · both themes expose every token', async ({ page }) => {
  await page.goto('/');
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
    const got = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return Object.fromEntries(
        ['--canvas','--surface','--line','--text','--brand','--proof','--unproven','--blocker','--absent']
          .map((k) => [k, cs.getPropertyValue(k).trim()]));
    });
    for (const [k, v] of Object.entries((manifest.tokens as any)[theme])) {
      if (got[k] !== undefined) expect(got[k], `${theme} ${k}`).toBe(v);
    }
  }
});
```

Also add `scripts/gen-parity.mjs` that regenerates the manifest from `design/prototype.html` (same selectors), so a deliberate design change can update the target rather than being worked around.

**Validate**
```bash
npm run parity 2>&1 | tail -30
```

**Done when:** the command runs and reports failures per screen. **It is supposed to fail right now** — that failure list is your work queue. Screenshot it; it is your progress bar.

---

## Task 3 — Rename OpenGong → Deal Truth

**Goal:** one product name. Judges will notice two.

**Change** — replace every occurrence, then swap the `OG` monogram and `public/favicon.svg` for the Ashoka Chakra mark (12-spoke saffron ring on `chakra-900`; copy the `I.chakra` SVG from the prototype).

| File | Line |
|---|---|
| `src/components/layout/AppShell.tsx` | 30–32 |
| `src/pages/DashboardPage.tsx` | 58, 63 |
| `index.html` | 9, 17 |
| `package.json` | 2, 6 |
| `LICENSE` | 3 |
| `e2e/screenshot.spec.ts` | 8 |
| `e2e/demo.spec.ts` | 21 |
| `README.md` | 3, 22, 24, 32, 34, 133, 194, 214 |

*(Line numbers were taken at `cf5aa3e`; `main` has moved — re-grep rather than trusting them.)*

**Validate**
```bash
! grep -ril 'open.\?gong' src index.html README.md e2e package.json LICENSE && echo PASS
```

**Done when:** prints `PASS`. Add that same line as a `check:brand` script and include it in `npm run check`.

---

## Task 4 — Tokens and dark mode

**Goal:** one visual system, both themes, so nothing downstream needs a colour decision.

**Change**
- Replace `tailwind.config.js` and `src/index.css` with §2.1–2.2 of `design/UI_DESIGN_SPEC.md`, verbatim. `darkMode: 'class'`.
- Theme toggle in `AppShell`: persist `localStorage['dt-theme']`, default from `prefers-color-scheme`, `Cmd/Ctrl+D` shortcut.
- Load Instrument Serif · Plus Jakarta Sans · JetBrains Mono in `index.html` with `display=swap` and real fallbacks (`Georgia` for the serif) so a blocked CDN degrades instead of reflowing mid-demo.

**Validate**
```bash
npm run parity -- -g "both themes" && echo PASS
```

**Done when:** the token test passes for light *and* dark against the manifest.

---

## Task 5 — Delete the second visual era

**Goal:** today the app visibly gets cheaper when you leave Overview. 53 raw `slate-*` usages across 15 files are why.

**Change** — migrate every feature component to semantic aliases. Mapping table in `design/UI_CHANGES.md` §0.2. Delete the `navy-*` ramp (duplicate of `ink-*`) and the unused `evidence.*` tokens. Fix `SentimentChart`'s hardcoded `stroke="#0f1c2e"`. Standardise card padding to 18px / 22px only.

**Validate**
```bash
! grep -rnE '(slate|navy|teal|violet|emerald|amber)-[0-9]{2,3}' src/ && \
! grep -rn '#0f1c2e' src/ && echo PASS
```

**Done when:** prints `PASS`.

---

## Task 6 — `EvidenceStamp` and `EvidenceReceipt`

**Goal:** the atom of the product. Every claim in the app renders proof through these two components, so getting them right fixes ~60% of the visual gap at once.

**Change** — build both to `design/UI_DESIGN_SPEC.md` §3.1–3.2. Root class names **must** be `.stamp` (+ `.proof` / `.unproven` / `.absent` / `.blocker`) and `.receipt`. Then replace the `EvidenceLink` two-button pattern everywhere with **one receipt + one ghost button** — several cards currently render a receipt-equivalent *and* a duplicate play button.

The absence variant renders prose, not a quote: *"No evidence found. The customer never raised this — we report the gap instead of guessing."*

**Validate**
```bash
npm test -- evidence && npm run parity -- -g "call:verdict" 2>&1 | grep -E "receipts|stamps"
```

**Done when:** `call:verdict` reports `receipts: 12` and `stamps: 26` (±25%).

---

## Task 7 — Restructure the call workspace

**Goal:** fixes a live demo landmine. `TranscriptPanel` is what calls `playRange()`, and it only mounts on the Transcript tab — so **"Play evidence" is silent from the Insights tab today.** A permanently mounted rail makes every play button work from every view.

**Change**
- Five tabs → four views: `verdict` · `record` · `act` · `brief`. Delete the Insights tab (a 12-component dump) and the standalone Call Info tab; fold Outline chapters into the waveform lane.
- Two-pane layout, `xl:grid-cols-[minmax(0,1fr)_400px]`, right rail `sticky top-[74px]` containing `AudioPlayer` + `TranscriptPanel`, **both always mounted**.
- Below 1180px the rail stacks under and the player becomes `sticky bottom-4`.
- Section placement table in `design/UI_CHANGES.md` §0.3.

**Validate**
```bash
npm run parity -- -g "call:" 2>&1 | grep transcriptSegments
```

**Done when:** `transcriptSegments: 37` on **all four** call views — proving the transcript is mounted everywhere, not just one tab.

---

## Task 8 — The choreographed play chain

**Goal:** this is the "oh damn" moment and the single highest-leverage change in the repo. The interaction already works; it just isn't choreographed.

**Change** — one click on any claim triggers five things together:
1. `t=0` receipt gets `ring-2 ring-proof`
2. `t=0` transcript rail scrolls the cited segment to centre, segment gets `bg-proof-soft` + a one-shot pulse ring
3. `t=60ms` waveform playhead moves to `start_ms`; a translucent `proof` evidence band scales in over `start_ms → end_ms`
4. `t=80ms` audio plays
5. quote text fills left-to-right with a saffron karaoke highlight, in the receipt *and* the transcript row

Drive the highlight from one `requestAnimationFrame` loop via a CSS custom property:
```css
.karaoke{background:linear-gradient(90deg,rgb(255 153 51/.32) var(--k,0%),transparent var(--k,0%));
  border-radius:3px;transition:background .12s linear}
```

**Validate** — add `e2e/evidence-chain.spec.ts`:
```ts
test('claim click → transcript focus + audio + waveform band', async ({ page }) => {
  await page.goto(`/calls/${CALL}/verdict`);
  await page.locator('.receipt .btn.play').first().click();
  await expect(page.locator('.seg.focus')).toBeVisible();
  await expect(page.locator('.evidence-band')).toHaveCount(1);
  expect(await page.evaluate(() => !!document.querySelector('audio') &&
    !document.querySelector('audio')!.paused)).toBe(true);
});
```
```bash
npx playwright test e2e/evidence-chain.spec.ts
```

**Done when:** passes from **every** view, not just Verdict. Parameterise the test over all four.

---

## Task 9 — `ProofRing` + `SignalTile`

**Goal:** the screenshot people share, and the honest answer to "how's this deal doing?" without inventing a number.

**Change** — `design/UI_DESIGN_SPEC.md` §3.3–3.4. 24 spokes (Ashoka), 8 dimensions × 3, animated in sequentially. Inner disc filled `surface` — without it the centre text is unreadable. Derive the 8 states from `report.buyingIntent` per the mapping table. Legend beneath: `● n proven · ● n blocked · ● n not found`.

**Validate**
```bash
npm run parity -- -g "call:verdict" 2>&1 | grep -E "signalTiles|proofRing"
```
Plus assert the spoke count directly:
```ts
expect(await page.locator('.ring-wrap line').count()).toBe(24);
```

**Done when:** `signalTiles: 8`, `proofRing: 1`, 24 spokes.

---

## Task 10 — Rebuild `RealityCheck`

**Goal:** the strongest concept in the product is currently the 3rd card inside a scroll-stack on a non-default tab, in grey. This is the frame that ends up in the launch post.

**Change** — §3.5. Three columns at ≥820px: saffron `said` / 74px `VS` badge (52px circle, dashed) / green `truth`. Both quotes mono 13px, both sides have play buttons, verdict strip beneath with the `reason_code` in mono in the header. Promote to **third position on the default view**. Give it more vertical space than feels necessary.

**Validate**
```bash
npm run parity -- -g "call:verdict" 2>&1 | grep realityChecks
```

**Done when:** `realityChecks: 2` on Verdict and `1` on the shared page, and both play buttons resolve to different segments (`seller_segment_id` ≠ `customer_segment_id`).

---

## Task 11 — Lock the follow-up email

**Goal:** demonstrates a blocking gate more convincingly than any architecture diagram, in ~15 lines.

**Change** — `FollowUpPanel` already tracks removed sentences in a local `Set`. Add:
```tsx
const unsupportedLeft = sentences.filter((s, i) => s.kind === 'unsupported' && !removed.has(i)).length;
<Button variant="primary" disabled={unsupportedLeft > 0}>
  {unsupportedLeft > 0 ? '🔒 Locked by the evidence gate' : 'Copy the draft'}
</Button>
```
Plus a **"Hear what they actually said"** button on the unsupported row pointing at the contradicting customer segment.

**Validate**
```ts
test('send is locked until the unsupported claim is removed', async ({ page }) => {
  await page.goto(`/calls/${CALL}/act`);
  const send = page.getByRole('button', { name: /locked|copy the draft/i });
  await expect(send).toBeDisabled();
  await page.getByRole('button', { name: /remove this sentence/i }).click();
  await expect(send).toBeEnabled();
});
```

**Done when:** that test passes. It is the cleanest proof of the whole thesis.

---

## Task 12 — Refused claims card

**Goal:** the Loop Depth trophy (15% of the score). Right now the reasons are computed and then deleted.

**Change** — `src/features/gate/RefusedClaimsCard.tsx`. Prefer `GET /calls/{id}/refusals` (API task 1). **Fallback needing no backend work:** `GET /calls/{id}/events` already contains `validate/FAILED` rows carrying `error_code` and `details.{title,insight_type}` — filter and render those. Card bordered `blocker-line`, headed *"N claims the model wanted to ship. The gate refused all N."*, each refusal struck through with its mono error code.

**Validate**
```bash
npx playwright test -g "refused"
```
```ts
await expect(page.locator('.receipt.blocker')).toHaveCount(4);
await expect(page.getByText(/EVIDENCE_(UNSUPPORTED|WRONG_SPEAKER|SEGMENT_MISSING)/)).toHaveCount(4);
```

**Done when:** 4 refusals render with their error codes, from either source.

---

## Task 13 — Processing gate log

**Goal:** turns a progress bar into the harness on stage.

**Change** — `<GateLog />` beside the stage list, fed from the event stream. Mono 11.5px, auto-scrolled, refusals struck through with `✕`. Add SSE reconnection: the stream has a **~30s idle cut-off, no heartbeat, and no terminal event on timeout** — keep the 1.5s poll as the floor and add a 120s stall warning.

**Validate**
```bash
npx playwright test -g "processing"
```
```ts
await expect(page.locator('.gl-row')).toHaveCount(16, { timeout: 15000 });
await expect(page.locator('.gl-row .gl-bad')).toHaveCount(4);
```

**Done when:** 16 log rows, 4 of them refusals.

---

## Task 14 — Search, evidence-first

**Goal:** the current build has search; losing it is a regression. Rebuilt, it becomes a feature instead of a utility.

**Change** — §5.7. A result is **a moment somebody said, rendered as a receipt with a play button** — not a document link. Insights group first, then spoken moments grouped by call. Highlight matches with `<mark>` client-side. Calls with audio get an `audio available` chip; others show `transcript only` and an "Open call →" button — never a play button that produces silence. No-results renders in the absence style: *"Nothing in any transcript matches "X". We return no result rather than a loose one."*

Keep the client-side fallback in `endpoints/localIntelligence.ts` — it is what makes search work when `/search` 404s.

**Validate**
```bash
npx playwright test -g "search"
```
```ts
await page.goto('/search?q=security');
await expect(page.locator('.receipt')).not.toHaveCount(0);
await expect(page.locator('mark')).not.toHaveCount(0);
await page.goto('/search?q=zzzqqq');
await expect(page.getByText(/We return no result rather than a loose one/)).toBeVisible();
```

---

## Task 15 — Deal timeline

**Goal:** answers *"is this deal getting better or worse?"* without inventing a score — and surfaces the sharpest finding in the product: a dimension that was proven last call and silently disappeared.

**Change** — §5.8. Trend chart (proven / blocked counts per call, y-axis 0–8) + an **8 × N change matrix** where any cell that flipped since the previous call gets a saffron ring + a "what moved backwards" list. Where a regression is an *absence*, say so honestly: *"Nothing was said on this call — there is no clip to play. That is the finding."*

Needs API task 3. Until then group `GET /calls` on `customer_name` client-side.

**Validate**
```bash
npm run parity -- -g "deal" 2>&1 | grep matrixCells
```

**Done when:** `matrixCells: 24` (8 dimensions × 3 calls) and at least 4 cells carry the flipped marker.

---

## Task 16 — Integrations + the evidence-gated send dialog

**Goal:** the same gate the audience watched block an email, now running on the system of record. Strongest integration story available — every other tool writes the model's output straight into the CRM and inherits its hallucinations.

**Change** — §5.9. `/integrations` with HubSpot and Slack cards. The send dialog is a **field-by-field table with provenance**, three states:

| State | Rendering |
|---|---|
| `SUPPORTED` | prefilled, `✓ PROVEN` stamp, play button with timestamp, skippable |
| `MANUAL` | blank + the reason it isn't knowable from a call (deal amount, pipeline stage, close date) |
| `BLOCKED` | disabled, **not overridable** — *"The customer refused to commit to a next meeting. Writing one would create a commitment that does not exist."* |

Header shows live counts; submit reads **"Send n verified fields"**.

**Validate**
```ts
await expect(page.getByText('7 fields with evidence')).toBeVisible();
await expect(page.getByText('1 refused')).toBeVisible();
await expect(page.getByRole('button', { name: /log completed meeting/i })).toBeDisabled();
```

---

## Task 17 — The demo layer

**Goal:** you should not be clicking around live. The app presents itself.

**Change** — port from the prototype (`p7_present.js` equivalent):
- **Cold open** — title screen, Ashoka ring drawing spoke by spoke, "Run the 90-second demo" / "Explore it myself".
- **Presentation mode (`P`)** — the 13 beats, each navigating, playing the right audio, spotlighting the right element, with the line to say on a caption bar. `→`/`Space` advance, `←` back, `Esc` exit, Auto runs hands-free.
- **Command palette (`⌘K`)** — jump to any screen or straight to a specific quote, for off-script questions.

⚠️ **Two bugs I hit building this — do not reintroduce them:**
1. Closing the palette must **blur its input**, or the input keeps focus and every global shortcut silently dies.
2. Never write `opacity:0` + `animation:…forwards` as a reveal. The spotlight's `animation` shorthand *replaces* it and the element snaps back to invisible. Put the from-state inside the keyframes:
```css
.reveal{animation:rv .5s cubic-bezier(.2,.7,.3,1) both}
@keyframes rv{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
```

**Validate** — add `e2e/presentation.spec.ts` walking all 13 beats:
```ts
test('presentation walks every beat and hides nothing', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('p');
  for (let i = 0; i < 13; i++) {
    await page.waitForTimeout(900);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('#root *')]
      .filter(e => { const c = getComputedStyle(e), r = e.getBoundingClientRect();
        return r.height > 40 && r.width > 40 && +c.opacity < .35 && c.visibility !== 'hidden'; }).length);
    expect(hidden, `beat ${i + 1} left elements invisible`).toBe(0);
    await page.keyboard.press('ArrowRight');
  }
});
```

**Done when:** all 13 beats pass with zero invisible elements.

---

## Task 18 — Close the gate

**Goal:** none of this silently regresses before Friday.

**Change**
- Repoint `e2e/screenshot.spec.ts` at the **Verdict view in dark mode, scrolled to the Reality Check** — that's the README hero and the launch-post image. Generated, not hand-cropped.
- Add the three invariant guards from `00_RUNBOOK.md` §5 to `npm run check`.
- Fix the remaining landmines from `design/UI_CHANGES.md` §0.4: remove `attention.slice(0,2)`, normalise `MomentsTimeline` by `durationMs` not `max(startMs)`, guard `mapToFile` behind `env.useMocks`, promote `DealSignalStrip`, delete `ProgressSteps.tsx`.

**Validate**
```bash
npm run check && npm run test:e2e && npm run screenshot:demo && echo "READY"
```

**Done when:** prints `READY` and `npm run parity` reports **zero drift on every screen**. That is the definition of "the React app matches the prototype."
