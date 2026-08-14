# `deal-truth-ui` — implementation plan

**Target repo:** `github.com/pratima-mahato/deal-truth-ui` (React 18.3.1 · Vite 7 · Tailwind 3.4.17 · react-router 7 · TanStack Query 5 · zod · MSW · Recharts · lucide)

Read `UI_DESIGN_SPEC.md` first — it holds the tokens and component specs this plan refers to.

The good news: **the data layer is already right.** `src/api/adapters.ts` is 703 lines of defensive snake_case↔camelCase normalisation, the zod contracts in `src/api/contracts/` cover the whole report, `EvidenceFocusContext` + `AudioPlayerProvider` already implement the evidence→audio chain, and the Acme fixture is a genuinely well-written demo scenario. **Do not rewrite any of that.** Almost everything below is presentation-layer work.

Effort estimates assume one person with Cursor/Claude Code.

⚠️ This plan was written against `cf5aa3e`; `main` has since moved to `77513516`. Re-check the line numbers in §0.1 before applying, and see `FIGMA_GAP_ANALYSIS.md` — the Figma board shows a HubSpot/Slack integration that exists in no repo I could see, so some of it may have landed in between.

---

## P0 — Ship-blockers (≈4h)

### 0.1 Rename OpenGong → Deal Truth (20 min)

Every remaining occurrence, with line numbers:

| File | Line | Current |
|---|---|---|
| `src/components/layout/AppShell.tsx` | 30–32 | `OG` monogram + `<span…>OpenGong</span>` |
| `src/pages/DashboardPage.tsx` | 58 | hero eyebrow `OpenGong` |
| `src/pages/DashboardPage.tsx` | 63 | `…let OpenGong uncover what was said…` |
| `index.html` | 9 | meta description `OpenGong Lite — …` |
| `index.html` | 17 | `<title>OpenGong — Conversation intelligence</title>` |
| `package.json` | 2 | `"name": "open-gong-web"` |
| `package.json` | 6 | description `OpenGong Lite / DealTruth — …` |
| `LICENSE` | 3 | `Copyright (c) 2026 OpenGong contributors` |
| `e2e/screenshot.spec.ts` | 8 | `artifacts/open-gong-killer-screenshot.png` |
| `e2e/demo.spec.ts` | 21 | same path |
| `README.md` | 3, 22, 24, 32, 34, 133, 194, 214 | title, prose, table header, mermaid `subgraph UI["OpenGong"]`, docker tag, copyright |

Also replace `public/favicon.svg` and the `OG` monogram with the **Ashoka Chakra mark** (12-spoke saffron ring on `chakra-900`, as in the prototype's `I.chakra`). Add a CI guard so it can't regress:

```json
"scripts": { "check:brand": "! grep -ril 'open.\\?gong' src index.html README.md e2e" }
```

### 0.2 Swap the design tokens (60 min)

Replace `tailwind.config.js` and `src/index.css` with the versions in `UI_DESIGN_SPEC.md` §2.1–2.2. Set `darkMode: 'class'`. Add the theme toggle to `AppShell` (persist to `localStorage['dt-theme']`, default from `prefers-color-scheme`, `Cmd/Ctrl+D` shortcut).

Then kill the two-visual-eras problem. There are **53 literal `*-slate-N` usages across 15 files**, and they are all in the feature components — which means the largest surface of the product is generic cold-grey while the Overview is the designed one. Judges won't articulate it, but the app visibly gets cheaper the moment they leave Overview.

```bash
# audit, then fix by hand — a blind sed will get the semantics wrong
grep -rn 'slate-\|navy-\|teal-\|violet-' src/ | wc -l
```

Mapping:

| Old | New |
|---|---|
| `bg-white` | `bg-surface` |
| `bg-slate-50` / `bg-slate-100` | `bg-surface-2` / `bg-surface-3` |
| `text-slate-900` / `-700` / `-500` | `text-body` / `text-body-2` / `text-body-3` |
| `border-slate-200` | `border-line` |
| `violet-*` (interactive) | `brand` / `brand-soft` / `brand-line` |
| `teal-*` , `emerald-*` (supported) | `proof` / `proof-soft` / `proof-line` |
| `amber-*` (warning) | `unproven` / `unproven-soft` / `unproven-line` |
| `red-*` (blocker) | `blocker` / `blocker-soft` / `blocker-line` |
| `navy-*` | delete — it duplicates `ink-*` under a misleading name |

Delete the unused `evidence.{supported,uncertain,blocker}` tokens; the new semantic aliases replace them. Fix `SentimentChart`'s hardcoded `stroke="#0f1c2e"` — a colour that exists nowhere in the theme.

Standardise card padding to **18px / 22px only**.

### 0.3 Restructure the call workspace (2h) — *the important one*

`src/pages/CallDetailPage.tsx` currently renders five tabs (`overview / outline / transcript / insights / info`) where `insights` is a 12-component vertical dump. Replace with **four views plus a permanently mounted right rail**:

```tsx
const VIEWS = [
  { id: 'verdict', label: 'Verdict' },
  { id: 'record',  label: 'The record' },
  { id: 'act',     label: 'What to do' },
  { id: 'brief',   label: 'Manager brief' },
] as const;

<div className="grid gap-4 items-start xl:grid-cols-[minmax(0,1fr)_400px]">
  <div>{VIEW_COMPONENTS[view]}</div>
  <aside className="sticky top-[74px] max-h-[calc(100vh-96px)] flex flex-col gap-3">
    <AudioPlayer … />                       {/* always mounted */}
    <TranscriptPanel annotations={…} />     {/* always mounted, scrolls internally */}
  </aside>
</div>
```

**This fixes a live demo landmine.** `TranscriptPanel` is the component that reacts to `EvidenceFocus` and calls `playRange()` — and it only exists on the Transcript tab. So today, pressing "Play evidence" from the Insights tab produces *silence*. Mounting the rail permanently makes every play button work from every view, and produces the choreography the demo depends on: audio starts, transcript scrolls, waveform band appears, all at once.

Section placement:

| View | Components |
|---|---|
| `verdict` | `VerdictCard` (new) · `ProofRing` (new) + `DealSignalStrip` (promoted) · `RealityCheckSection` · `CustomerTruthSection` · `DealKillersSection` · `RefusedClaimsCard` (new) |
| `record` | `MomentsTimeline` · `SentimentChart` · `ObjectionsSection` · `CompetitorsSection` · `MetricsCard` (from `CallInfoView`) |
| `act` | `BattlecardPanel` · `CommitmentLedger` · `FollowUpPanel` |
| `brief` | `ManagerBriefPanel` · signal board · share + export |

Delete `OutlineView` from the tab bar (fold its chapters into the waveform lane) and delete the standalone `info` tab.

### 0.4 Fix the five known demo landmines (40 min)

1. **`OverviewStory.tsx`** — `model.attention.slice(0, 2)` silently drops the sharpest finding on the Acme call ("no next meeting committed"). Remove the cap; the Verdict view has room.
2. **`MomentsAndCompetitors.tsx`** — `MomentsTimeline` normalises by `max(startMs)` instead of `durationMs`, so the last moment always pins to 100% and its label clips. Use `call.durationMs`, and stagger ticks onto two rows.
3. **`AudioPlayerProvider.tsx`** — the `mapToFile` modulo trick maps a 12s mock clip onto 38 logical minutes. Keep it for mocks, but assert `env.useMocks` around it so it can never fire against real audio.
4. **`DealSignalStrip.tsx`** — currently used *only* on `SharedPage`. It is the most scannable artefact in the data model. Promote it to the Verdict view and, as pips, to every dashboard row.
5. Delete `src/components/ui/ProgressSteps.tsx` (dead code, superseded by `ProcessingTimeline`).

---

## P1 — The demo beats (≈5h)

### 1.1 `EvidenceReceipt` + `EvidenceStamp` (90 min)

New: `src/components/evidence/EvidenceStamp.tsx`, `src/components/evidence/EvidenceReceipt.tsx`. Specs in `UI_DESIGN_SPEC.md` §3.1–3.2.

Then replace the current `EvidenceLink` two-button pattern (*Play evidence* / *Why we think this*) everywhere with **one receipt plus one ghost button**. Today several cards render a receipt-equivalent *and* a duplicate play button; that redundancy reads as unfinished.

`EvidenceLink` stays as the low-level primitive that `EvidenceReceipt` calls.

### 1.2 The choreographed play chain (60 min)

In `AudioPlayerProvider`, expose elapsed progress for the active range. In `TranscriptPanel` and `EvidenceReceipt`, drive the karaoke fill from it:

```tsx
const pctDone = playing ? (currentMs - rangeStart) / (rangeEnd - rangeStart) : 0;
<span className="karaoke" style={{ '--k': `${pctDone * 100}%` }}>{segment.text}</span>
```

Add the waveform evidence band and move the playhead in the same effect. One `requestAnimationFrame` loop, one style write per frame. This is the single highest-leverage change in the repo for "demo magnetism" — the interaction already works, it just isn't *choreographed*.

### 1.3 `RealityCheckSection` — rebuild as the confrontation (60 min)

The strongest concept in the product is currently the third card inside a scroll-stack on a non-default tab, styled in grey. Rebuild per `UI_DESIGN_SPEC.md` §3.5 — three-column split, saffron vs green, dashed `VS` badge, play buttons on both sides, verdict strip beneath — and promote it to third position on the default view.

### 1.4 Lock the follow-up email (30 min)

`FollowUpPanel.tsx` already tracks removed sentences in a local `Set`. Add the gate:

```tsx
const unsupportedLeft = sentences.filter((s, i) =>
  s.kind === 'unsupported' && !removed.has(i)).length;

<Button variant="primary" disabled={unsupportedLeft > 0}>
  {unsupportedLeft > 0 ? '🔒 Locked by the evidence gate' : 'Copy the draft'}
</Button>
```

Add a **"Hear what they actually said"** button on the unsupported row, pointing at the contradicting customer segment (`sg46` — *"Send me something and I'll get back to you."*). Rep claims a meeting → customer's actual voice says otherwise → button unlocks only after removal. That is a blocking gate the room can *hear*.

### 1.5 `ProofRing` (45 min)

New `src/features/signals/ProofRing.tsx`, spec in §3.3. Pure SVG, no dependency. Derive the 8 states from `report.buyingIntent` per §3.4.

### 1.6 `RefusedClaimsCard` (45 min)

New `src/features/gate/RefusedClaimsCard.tsx`.

Preferred source is the new `GET /calls/{id}/refusals` endpoint (`BACKEND_CHANGES.md` §1). **Fallback that needs no backend work:** `GET /calls/{id}/events` already contains `validate/FAILED` rows carrying `error_code` and `details.{title,insight_type,message}`. Filter and render those. This gets the Loop Depth story on screen today.

### 1.7 Processing gate log (40 min)

Extend `ProcessingTimeline.tsx` with a `<GateLog />` beside the stage list (§3.8), fed from the same event stream, refusals struck through. Add SSE reconnection — the stream has a **~30s idle cut-off, no heartbeat, and no terminal event on timeout**; the existing 1.5s poll is the safety net, keep it.

---

## P1.5 — Integrations (≈2h) — *the feature area the Figma revealed*

The Figma board shows a HubSpot + Slack integration that exists in no repo on `main`. See `FIGMA_GAP_ANALYSIS.md` for the full read. Three pieces:

**1.5.1 `/integrations` page (45 min).** Two cards — HubSpot (`proof`-bordered, connected) and Slack (`unproven`-bordered until a webhook is saved), plus a status pill and the "why this is different" three-tile card. Spec in `UI_DESIGN_SPEC.md` §5.9.

**1.5.2 The evidence-gated send dialog (60 min) — the valuable one.** Field-by-field mapping to HubSpot where each field is `SUPPORTED` (prefilled, play button, skippable), `MANUAL` (blank, with the reason it can't be derived from a call), or `BLOCKED` (disabled, not overridable). Submit reads **"Send n verified fields"**.

The Figma's own footnotes already found this feature without naming it — *"Deal amount, pipeline, and stage are not in the call report"* and *"No follow-up meeting was committed on the call, so Log meeting is off."* Make those two sentences the centre of the design rather than fine print, and you have the gate operating on the CRM, which is a stronger close than the email.

**1.5.3 `Send to HubSpot` in the call header + a `CRM & team actions` card at the top of *What to do* (15 min).**

Backend dependency: `BACKEND_CHANGES.md` §11 — field-level provenance on the CRM payload, and a server-side save endpoint for the Slack webhook (the board notes there isn't one).

---

## P2 — Polish (≈3h)

- **Three-axis sentiment** (§5.4). `SentimentChart` currently draws one Recharts line. Replace with a dual-line SVG plus the divergence callout. Consider dropping Recharts entirely — it is a heavy dependency (it pulls in a large slice of d3) used in exactly one place, and this chart is ~40 lines of hand-rolled SVG.
- **Workspace table → proof pips** (§5.1). Replace the plain `<table>` with the bordered rows layout and 8 pips per call.
- **Shared page** (§5.7) — currently a third distinct layout. Rebuild as the light editorial report.
- **Waveform** — real peaks if `report.metrics` can supply them; otherwise keep the seeded generator but stop the demo depending on scrubbing.
- **Transcript filter row** — the current build has transcript search and a filter-by-speaker dropdown; both were dropped when the transcript moved to the rail. Restore as a compact row above the rail transcript: a search input plus an All / Customer / Rep toggle. On a 38-minute call a judge will want to type "security" and jump.
- **Search page** — keep the client-side fallback in `endpoints/localIntelligence.ts`; it is genuinely clever and it is what makes search work when `/search` 404s. Just restyle it.
- **`e2e/screenshot.spec.ts`** — repoint at the Verdict view in **dark** mode, scrolled to the Reality Check. That is the README hero image and the launch-post screenshot; it should be generated, not cropped by hand.

---

## Dependency notes

Nothing new is required. Specifically:

- **No animation library.** Every motion in the spec is a Tailwind keyframe or one `requestAnimationFrame` loop. Adding Framer Motion buys nothing here and costs bundle size.
- **Consider removing** `recharts` after P2.
- Add the three fonts to `index.html` (Instrument Serif · Plus Jakarta Sans · JetBrains Mono) with `display=swap` and real fallbacks (`Georgia` for the serif) so a blocked CDN degrades gracefully rather than reflowing mid-demo.

---

## Suggested order

| Slot | Work |
|---|---|
| Hour 1 | 0.1 rename · 0.2 tokens + dark mode |
| Hours 2–3 | 0.3 workspace restructure · 0.4 landmines |
| Hours 4–5 | 1.1 receipt + stamp · 1.2 play chain |
| Hour 6 | 1.3 Reality Check · 1.4 email gate |
| Hour 7 | 1.5 proof ring · 1.6 refused claims |
| Hour 8 | 1.7 gate log · screenshot spec |
| Hours 9–10 | 1.5 Integrations page · evidence-gated send dialog |
| Remaining | P2 in listed order |

**Stop-loss:** if you reach hour 6 with items 1.1–1.4 done, the demo is safe. Everything after that is score, not survival.
