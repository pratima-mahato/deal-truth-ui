# Start here — Deal Truth UI

You're rebuilding the Deal Truth web app to match a finished prototype. Everything you need is in this folder. **Read this once (3 min), then start.**

---

## 1. What you're building

A sales-call intelligence app whose entire idea is one sentence:

> **No proof in the transcript, no claim in the report.**

Every finding in the UI carries a receipt — click it and you hear the customer actually say it. Your job is to make the React app look and behave exactly like `design/prototype.html`.

**Open the prototype first. Press `P`.** It runs a 13-beat scripted demo of itself in 90 seconds. That's the product, and that's what you're building toward. Do this before you write any code.

---

## 2. Setup (10 min)

```bash
git checkout -b feat/deal-truth-ui-revamp

# drop the design folder in at the repo root, then:
git add design && git commit -m "design: add prototype, spec and parity manifest"

npm install
npm run dev            # app on :5173 — MSW mocks the whole API, no backend needed
open design/prototype.html   # the target
```

Add these to `package.json` → `scripts`:

```json
"design": "open design/prototype.html || xdg-open design/prototype.html",
"parity": "playwright test e2e/parity.spec.ts",
"check": "npm run typecheck && npm run lint && npm test && npm run parity"
```

**You do not need the API or the ML service.** MSW covers everything for the first 11 tasks. Build the whole demo offline.

---

## 3. How to work

Open the repo in Cursor (or Claude Code). Paste **all of `PROMPT_UI.md`** as your first message, with this line on top:

> Work through this file one task at a time. After each task, run the Validate command and show me the output before moving to the next. If a Validate command fails, fix it before continuing — do not proceed with a failing check.

Then go task by task. There are 18. Each one has:

| | |
|---|---|
| **Goal** | why it exists — if you can't say the user-visible effect, don't build it |
| **Change** | the files and behaviour |
| **Validate** | a command that exits 0 or fails |
| **Done when** | the observable result |

**Don't batch tasks.** The whole point is catching drift at the step that caused it.

---

## 4. Your progress bar

```bash
npm run parity
```

This diffs your app against the prototype, screen by screen, and prints exactly what's off:

```
call:verdict drifted from the prototype:
  signalTiles: expected 8, got 0
  realityChecks: expected 2, got 0
  transcriptSegments: expected 37, got 0
```

**It's supposed to fail on day one.** That failure list is your work queue. It shrinks as you go. When it's empty, you're done — that's the definition of "matches the prototype", and it isn't a matter of opinion.

⚠️ **This only works if you use the prototype's class names** on your components: `.card` `.receipt` `.stamp` `.chip` `.sig` `.reality` `.ring-wrap` `.seg` `.btn.play` `.emailline` `.matrix .cell` `.gl-row` `#waveMain b` `.lane-tick`. Treat them as the component contract — add your own classes alongside, never rename these.

---

## 5. Three rules you can't break

These are the product, not style preferences. They're in CI.

1. **No close probability.** No 0–100 score, no %, no "likelihood". Only observed dimensions: proven / blocked / not found. Every competitor shows a fake confidence number; refusing to is our differentiator.
2. **Absence is a result.** "The customer never gave a timeline" renders as a dashed, muted finding with no quote — not an empty state, and never a guess.
3. **Quotes are verbatim transcript text**, resolved from `segment_ids`. Never model prose inside quotation marks.

---

## 6. Order, and what actually matters

| Tasks | What | Blocked by |
|---|---|---|
| **1–8** | tokens, shell, evidence receipt, workspace restructure, the play chain | nothing |
| **9–11** | proof ring, reality check, locked email | nothing |
| 13, 14, 17 | gate log, search, demo mode | nothing |
| 12, 15, 16, 18 | refused claims, deal timeline, integrations, pips | backend — **fallbacks specced, build them anyway** |

**Tasks 1–8 are the demo.** If you get nothing else done, the presentation still works. Everything after is score.

Tasks 6, 8, 10 and 11 are the four that win the room — the evidence receipt, the choreographed play chain, the Reality Check, and the follow-up email whose send button locks. Give those your best hours.

---

## 7. When a Validate fails

Read the failure, fix the cause, re-run. Don't loosen the check to make it pass — if the manifest genuinely needs to change because of a deliberate design decision, regenerate it (`node scripts/gen-parity.mjs`) and say so in the commit message.

Two bugs I already hit — don't reintroduce them:

- **Closing the command palette must blur its input.** Otherwise it keeps focus and every keyboard shortcut silently stops working.
- **Never write `opacity:0` + `animation:…forwards` as a reveal.** Any other animation on that element (the presentation spotlight, for one) replaces the shorthand and the element snaps back to invisible. Put the from-state inside the keyframes instead.

---

## 8. Ping the backend team at two points

Neither blocks you — you have fallbacks for both.

1. When **API tasks 1 and 3** land → swap task 12 (refused claims) and task 15 (deal timeline) off their fallbacks onto the real endpoints.
2. When **ML task 1 + API task 7** land → the three-axis sentiment section on the *record* view goes live.

Until then, task 12 reads `validate/FAILED` rows from `GET /events`, and task 15 groups `GET /calls` on `customer_name` client-side. Both already work.

---

## 9. Done

```bash
npm run check && npm run test:e2e && npm run screenshot:demo
```

Green, `npm run parity` reporting zero drift on every screen, and `artifacts/` holding the hero screenshot.

---

## 10. Demo-day insurance

Keep `design/prototype.html` open in a browser tab on the day. It's a single file, needs no server and no network, and has the audio baked in. If anything goes wrong on stage, present from it — press `P` and it runs itself. Nobody in the room can tell the difference.
