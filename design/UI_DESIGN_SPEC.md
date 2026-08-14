# Deal Truth — UI Design Spec

**Version 1.0 · PyAI Hackathon, August 2026 · SaaS Labs**

This document is written to be pasted, whole or in sections, into a UI generation tool (v0, Lovable, Cursor, Claude Code) to produce the React + Tailwind implementation. Every data binding below uses the **literal field names returned by `deal-truth-api`**, so generated code wires up against the real backend without a translation step.

Companion documents: `UI_CHANGES.md` (what to change in `deal-truth-ui`), `BACKEND_CHANGES.md` (what the API must add).

---

## 1. What this product is

Deal Truth turns a sales call into notes **where every claim carries a receipt**.

The product invariant, which the API returns literally in `report.invariant`:

> **NO PROOF IN THE TRANSCRIPT, NO CLAIM IN THE REPORT.**

The model may infer. The evidence layer decides whether the inference ships. That single sentence is the whole design brief — the interface's job is to make *proof* the most visible object on the screen, not the summary.

**Three rules the UI must never break:**

1. **No close probability, ever.** No "84% likely to close", no risk score, no health gauge with a needle. Only observable dimensions with a proven / blocked / not-found state. This is a stated product position and judges will notice if it's violated.
2. **Absence is a first-class result.** "The customer never gave a timeline" is a finding, rendered distinctly (dashed, muted, no quote), not an empty state and not a guess.
3. **Every quote is verbatim transcript text.** Quotes come from `transcript_segments.text` via `segment_ids`. The UI never renders model-generated prose inside quotation marks.

### The demo this UI must win

The judging rubric is Product pull 30% · Demo magnetism 25% · API gravity 20% · Loop depth 15% · Craft 10%. The flow the interface is built around is **doubt → proof → reveal**:

| Beat | Screen | The line |
|---|---|---|
| 1 | Upload → Processing | "Drop a call. 33 seconds." |
| 2 | Verdict | "Here's the deal, in one sentence." |
| 3 | *(judge thinks: AI summaries hallucinate)* | — |
| 4 | Click any claim | **The customer's actual voice plays.** |
| 5 | Reality Check | "The rep thinks this closes this month. Here's the customer, 23 seconds later." |
| 6 | Rejected claims | "Four claims the model wanted to ship. The gate refused all four." |
| 7 | Follow-up email | "The send button is locked, because one sentence claims a meeting that was never agreed." |

Beat 4 is the "oh damn". Beat 6 wins Loop Depth. Beat 7 wins Product Pull. **Design every layout decision to shorten the distance to beat 4.**

---

## 2. Art direction — Tiranga

The palette derives from the Indian flag (the hackathon lands on Independence Day, 15 August 2026), but it is **not decoration** — each colour carries a fixed semantic that maps onto the evidence model. This is what stops it being a gimmick.

| Flag colour | Semantic | Used for |
|---|---|---|
| **Saffron** `#FF9933` | *attention* | `UNCONFIRMED` evidence, warnings, the seller's side of a Reality Check, the playhead |
| **White** | *the record* | Card surfaces, the transcript, the shared report |
| **India green** `#138808` | *proven* | `SUPPORTED` evidence, the customer's verified words, play-evidence affordances |
| **Chakra navy** `#000080` | *the instrument* | Brand, primary actions, links, the app chrome |

Two additions the flag does not supply, both required for legibility:

- **Blocker rust** `#C42718` — `DEAL_RISK` at high severity, refused claims. Deliberately warm so it reads as a sibling of saffron, not an alien alert red.
- **Absent grey**, always **dashed** — `ABSENCE_BASED` findings. The dashed border is the semantic: there is nothing to point at.

Independence Day is acknowledged with exactly two touches — a 4px tricolour rule pinned to the top of the app, and the Ashoka Chakra as the proof-ring motif. **Resist adding more.** The restraint is what makes it read as design rather than a theme.

Both light and dark are first-class. Dark is the default for the working app on a projector; light is the default for the shared report a customer opens.

### 2.1 `tailwind.config.js` — copy verbatim

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: { 50:'#FFF7ED',100:'#FFEDD5',200:'#FED7AA',300:'#FDBA74',400:'#FF9933',
                   500:'#F97316',600:'#EA6A0A',700:'#C2500A',800:'#9A3E12',900:'#7C3512' },
        india:   { 50:'#F2FBEF',100:'#DFF5D8',200:'#BFEBB2',300:'#94DB80',400:'#62C74A',
                   500:'#35AE1D',600:'#1E9B0E',700:'#138808',800:'#0F6D07',900:'#0B5205' },
        chakra:  { 50:'#EEF1FF',100:'#DDE3FF',200:'#BCC7FF',300:'#93A4FF',400:'#6B80FB',
                   500:'#4A5EF0',600:'#2F41D6',700:'#1B2BA8',800:'#0D1A80',900:'#000080',950:'#05063D' },
        ink:     { 0:'#FFFFFF',50:'#F7F8FB',100:'#EEF0F6',200:'#DFE2EC',300:'#C4C9D8',400:'#9298AE',
                   500:'#6B7189',600:'#4E5468',700:'#383D4E',800:'#232734',900:'#14161F',950:'#0B0C12' },
        rust:    { 300:'#F79A92',400:'#F2564B',500:'#E03A2F',600:'#C42718',700:'#9E1C10' },

        // semantic aliases — components use ONLY these, never the ramps above
        canvas:   'var(--canvas)',
        surface:  { DEFAULT:'var(--surface)', 2:'var(--surface-2)', 3:'var(--surface-3)' },
        line:     { DEFAULT:'var(--line)', strong:'var(--line-strong)' },
        body:     { DEFAULT:'var(--text)', 2:'var(--text-2)', 3:'var(--text-3)' },
        brand:    { DEFAULT:'var(--brand)', soft:'var(--brand-soft)', line:'var(--brand-line)', ink:'var(--brand-ink)' },
        proof:    { DEFAULT:'var(--proof)', soft:'var(--proof-soft)', line:'var(--proof-line)' },
        unproven: { DEFAULT:'var(--unproven)', soft:'var(--unproven-soft)', line:'var(--unproven-line)' },
        blocker:  { DEFAULT:'var(--blocker)', soft:'var(--blocker-soft)', line:'var(--blocker-line)' },
        absent:   { DEFAULT:'var(--absent)', soft:'var(--absent-soft)', line:'var(--absent-line)' },
      },
      fontFamily: {
        display: ['"Instrument Serif"','Georgia','serif'],
        sans:    ['"Plus Jakarta Sans"','ui-sans-serif','system-ui','sans-serif'],
        mono:    ['"JetBrains Mono"','ui-monospace','SFMono-Regular','monospace'],
      },
      borderRadius: { card:'14px', tile:'11px', pill:'999px' },
      boxShadow: {
        card:'var(--shadow-card)',
        lift:'var(--shadow-lift)',
      },
      keyframes: {
        stampIn:{ '0%':{opacity:0,transform:'scale(1.5) rotate(-14deg)'},
                  '60%':{opacity:1,transform:'scale(.94) rotate(2deg)'},
                  '100%':{opacity:1,transform:'scale(1) rotate(-1.2deg)'} },
        segPulse:{ '0%':{boxShadow:'0 0 0 0 rgb(19 136 8 / .55)'},'100%':{boxShadow:'0 0 0 12px transparent'} },
        spokeIn:{ from:{opacity:0}, to:{opacity:1} },
        rise:{ from:{opacity:0,transform:'translateY(10px)'}, to:{opacity:1,transform:'none'} },
        barPulse:{ '0%,100%':{transform:'scaleY(.3)',opacity:.5},'50%':{transform:'scaleY(1)',opacity:1} },
      },
      animation: {
        stamp:'stampIn .42s cubic-bezier(.2,.9,.25,1.2) both',
        pulse1:'segPulse .85s ease-out 2',
        spoke:'spokeIn .5s ease both',
        rise:'rise .5s cubic-bezier(.2,.7,.3,1) forwards',
        bar:'barPulse 1.05s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
```

### 2.2 CSS variables — `src/index.css`

```css
:root{
  --canvas:#FBFAF8; --surface:#FFFFFF; --surface-2:#FAFAFC; --surface-3:#F2F3F8;
  --line:#E4E6EF; --line-strong:#CFD3E2;
  --text:#14161F; --text-2:#4E5468; --text-3:#8A90A6;
  --brand:#0D1A80; --brand-ink:#FFFFFF; --brand-soft:#EEF1FF; --brand-line:#BCC7FF;
  --proof:#0F6D07;    --proof-soft:#F2FBEF;    --proof-line:#BFEBB2;
  --unproven:#C2500A; --unproven-soft:#FFF7ED; --unproven-line:#FED7AA;
  --blocker:#C42718;  --blocker-soft:#FEF2F1;  --blocker-line:#F7C7C2;
  --absent:#6B7189;   --absent-soft:#F7F8FB;   --absent-line:#C4C9D8;
  --shadow-card:0 1px 2px rgb(11 12 18 / .05), 0 10px 28px -12px rgb(11 12 18 / .12);
  --shadow-lift:0 18px 48px -16px rgb(11 12 18 / .28);
}
html.dark{
  --canvas:#0B0C12; --surface:#14161F; --surface-2:#191C27; --surface-3:#20232F;
  --line:#282C3A; --line-strong:#383D4E;
  --text:#F2F3F8; --text-2:#A9AFC4; --text-3:#767D95;
  --brand:#6B80FB; --brand-ink:#05063D; --brand-soft:#141A3D; --brand-line:#2C3780;
  --proof:#62C74A;    --proof-soft:#0E2010;    --proof-line:#215B19;
  --unproven:#FF9933; --unproven-soft:#2A1A08; --unproven-line:#6E3F10;
  --blocker:#F2564B;  --blocker-soft:#2A100D;  --blocker-line:#77241C;
  --absent:#9298AE;   --absent-soft:#191C27;   --absent-line:#383D4E;
  --shadow-card:0 1px 0 rgb(255 255 255 / .03) inset, 0 12px 32px -16px rgb(0 0 0 / .8);
  --shadow-lift:0 24px 64px -20px rgb(0 0 0 / .9);
}
```

Theme is toggled by adding/removing `dark` on `<html>`, persisted to `localStorage['dt-theme']`, defaulting to `prefers-color-scheme`. **Never use `dark:` variants for semantic colour** — the variables already swap. Use `dark:` only for the rare structural difference.

### 2.3 Type

| Role | Family | Size / weight | Where |
|---|---|---|---|
| Verdict, page titles, big numerals | **Instrument Serif** 400 | 26–40px, `tracking-[-.02em]`, `leading-[1.1]` | The verdict sentence, page h1, the `n/8` in the proof ring |
| UI | **Plus Jakarta Sans** 400–800 | 12–15px | Everything else |
| Evidence | **JetBrains Mono** 400/500 | 10–13px, `tabular-nums` | Every quote, every timestamp, segment ids, error codes, the gate log |

The rule that carries the whole aesthetic: **quotes and timestamps are always mono, body copy is never mono.** Mono = "this came from the record." It is the typographic form of the invariant.

Eyebrow labels: 10.5px / 800 / `tracking-[.16em]` / uppercase / `text-body-3`.

---

## 3. Component inventory

Build these as the primitive layer. Everything else composes from them.

### 3.1 `<EvidenceStamp status />` — the atom

```
status: 'SUPPORTED' | 'UNCONFIRMED' | 'ABSENCE_BASED' | 'BLOCKER'
```

Inline badge, mono 10px/700, `tracking-[.12em]`, uppercase, 1.5px border in `currentColor`, `rotate(-1.2deg)`, radius 5px, transparent background.

| status | colour | label |
|---|---|---|
| `SUPPORTED` | `proof` | `✓ PROVEN` |
| `UNCONFIRMED` | `unproven` | `~ UNCONFIRMED` |
| `ABSENCE_BASED` | `absent`, **dashed**, no rotation | `∅ NOTHING SAID` |
| `BLOCKER` | `blocker` | `! BLOCKER` |

Animate `animation-stamp` on first paint when the parent enters view. It should land like an ink stamp. This is the single most repeated object in the product — get it right and the whole app feels designed.

### 3.2 `<EvidenceReceipt segment status onPlay />` — the signature component

The physical metaphor is a till receipt. Renders one transcript segment as proof.

```
┌ 3px dotted perforation down the left inner edge ─────────────┐
│ [✓ PROVEN]   21:14 · Sarah Mitchell            seg #24       │
│                                                              │
│ │ "We currently pay about $400. This would be almost double." │  ← mono, 2px left rule
│                                                              │
│ [▶ Play 5s]   [Show in transcript →]                         │
└──────────────────────────────────────────────────────────────┘
```

- Container: `rounded-[12px] border p-[11px_13px_11px_17px]`, tinted by status (`proof-soft`/`proof-line`, `unproven-*`, `blocker-*`, or `absent-soft` + **dashed** border).
- Perforation: `repeating-linear-gradient(to bottom, currentColor 0 4px, transparent 4px 8px)`, 3px wide, inset 5px from the left, opacity .55. Omitted for `ABSENCE_BASED`.
- Quote: mono 12.5px / `leading-[1.62]`, wrapped in typographic quotes, with a 2px left border in the status colour.
- Source line: mono 11px, `text-body-3` — `{mmss(start_ms)} · {speaker.display_name}` and, right-aligned, `seg #{sequence_number}`.
- While its audio is playing: `ring-2 ring-proof`, and the quote text fills left-to-right with a saffron highlight (see §6, karaoke).

**Absence variant** replaces the quote with prose, in body font, not mono: *"No evidence found. The customer never raised this — we report the gap instead of guessing."* Never fake a quote.

### 3.3 `<ProofRing signals />` — the Ashoka Chakra

An SVG ring of **24 spokes** — the Ashoka Chakra's spoke count — divided as 8 dimensions × 3 spokes.

- viewBox `0 0 186 186`, centre `93,93`, spokes from r=52 to r=86, `stroke-linecap="round"`.
- Outer guide circle r=90 in `line`; inner disc r=47 filled `surface`, stroked `line` — this disc is what makes the centre text legible, do not omit it.
- Spoke colour: proven → `proof` 3.4px · blocked → `blocker` 3.4px · weak → `unproven` 3.4px · missing → `absent-line` 2px **`stroke-dasharray="2.5 4"`**.
- Spokes animate in sequentially, `animation-spoke` with `${i * .028}s` delay. The ring should draw itself in ~700ms on mount.
- Centre: `n` in Instrument Serif 40px + `/8` at 24px in `text-body-3`; below, a two-line mono 8px `tracking-[.13em]` label `DIMENSIONS / PROVEN`.
- Below the ring, a legend row: `● n proven · ● n blocked · ● n not found`.

This is the product's most screenshot-able object and its only ornamental flourish. It is also honest — it counts observed dimensions, it is not a probability.

### 3.4 `<SignalTile dimension state onClick />`

One of the 8 `buying_intent` dimensions. Left edge is a 3px bar: solid in the state colour, or a dashed gradient for `missing`. Label 12px/700; value mono 10px/700 uppercase in the state colour. `hover:-translate-y-[2px]`. Click opens the Evidence Drawer.

State derivation from `report.buying_intent` (each item's `payload.dimension`, `payload.present`, `payload.absence`):

| Condition | state | value label |
|---|---|---|
| `present === true`, dimension is positive | `proven` | `PROVEN` |
| `present === true`, dimension ∈ {`competitor_active`,`blocker_active`} | `blocked` | `ACTIVE` / `SECURITY` |
| `present === false` on `next_meeting_committed` **and** a `no_next_meeting` deal_killer exists | `blocked` | `REFUSED` |
| `payload.absence === true` or `present === false` | `missing` | `NOT FOUND` |

### 3.5 `<RealityCheck check />` — the money shot

Full-width, three-column at ≥820px, stacked below.

```
┌───────────────────────────────────────────────────────────────────────┐
│ [⚠ Reality check]  The rep booked a close the customer never agreed to │  ← header, saffron gradient fade
│                                              OVERSTATED_INTENT (mono)  │
├────────────────────────────┬────┬─────────────────────────────────────┤
│ ● RAHUL — THE REP — IMPLIED│ VS │ ● SARAH — THE CUSTOMER — SAID       │
│ saffron-soft background    │    │ proof-soft background               │
│ "It sounds like you are    │(◌) │ "We still need to evaluate two      │
│  ready to purchase this    │    │  other vendors, and security has    │
│  month once those docs     │    │  to sign off before we can move     │
│  land."                    │    │  ahead."                            │
│ [▶ 31:42]                  │    │ [▶ 32:05]                           │
├────────────────────────────┴────┴─────────────────────────────────────┤
│ [! BLOCKER]  The rep asserted a purchase window. The customer …        │
└───────────────────────────────────────────────────────────────────────┘
```

- Centre column is 74px wide, containing a 52px circular `VS` badge with a **dashed** `unproven` border, and a 1px vertical `line` running above and below it (stopping 26px short of the badge).
- Both quotes mono 13px. Both sides have their own play button; the customer's is the `proof`-tinted variant.
- Data: `report.reality_checks[].payload.seller_segment_id` → left, `payload.customer_segment_id` → right, `payload.reason_code` → the mono code in the header, `summary` → the verdict strip.

Give this component **more vertical space than feels necessary**. It is the single frame that explains what the product is, and it is the frame that will end up in the launch post.

### 3.6 `<TranscriptSegment />`

Grid `52px 1fr`. Timestamp mono 10.5px in `text-body-3`. Speaker name 11px/800 uppercase, `proof` for customer / `brand` for seller, with a `· audio` suffix when a clip exists. Text 13px `leading-[1.62]` in `text-body-2`, in typographic quotes.

Focused: `bg-proof-soft border-proof-line`, text promoted to `text-body`, plus a one-shot `animate-pulse1` ring. Inline claim tags (from the insight → segment_ids reverse index) render as 9.5px/800 uppercase pills under the text.

### 3.7 `<Waveform />` + moments lane

- 150 bars, `flex-1` each, 2px gap, `items-end`, height 84px, radius 2px. Bars before the playhead are `brand`; the rest `line-strong`.
- **Playhead**: 2px saffron bar with a 3px saffron glow ring and an 8px dot cap, `transition: left .1s linear`.
- **Evidence band**: while playing a claim, a translucent `proof` band spans that segment's `start_ms → end_ms`, with 1.5px solid edges, scaling in vertically.
- **Moments lane** below: 16px circular ticks at `start_ms / duration_ms`, **staggered on two rows** (even index top, odd index +19px) so late-call clusters don't collide. `hover:scale-[1.28]`.
- **Speaker lane**: a 6px flex strip, one `<i>` per segment with `flex: (end_ms - start_ms)`, coloured by `speaker_role`. Reads as a talk-ratio ribbon for free.

If the real waveform peaks aren't available, generate them deterministically from the `call_id` — but do not build the demo around scrubbing; build it around clicking a claim.

### 3.8 `<GateLog />` — the harness on stage

Mono 11.5px, `leading-[1.7]`, on `canvas-2` inside a 11px-radius bordered box, max-height 230px, auto-scrolled to the bottom. Each row: a fixed 74px stage column in `text-body-3`, then the message prefixed `✓` (proof) / `!` (unproven) / `✕` (blocker) / `·` (dim). **Refusal rows render the claim with `line-through`.** Rows fade in as they arrive.

### 3.9 `<EmailSentence />`

One row per `follow_up.sentences[]`, tinted by `kind`: `FACT` → `proof`, `NON_FACTUAL` → neutral, `UNSUPPORTED` → `blocker`. Right side shows a play button with the mono timestamp for `FACT`; an `EvidenceStamp BLOCKER` for `UNSUPPORTED`; a muted `not a claim` chip otherwise.

Unsupported rows expand to show the reason, a **"Hear what they actually said"** button pointing at the contradicting customer segment, and a **Remove** button. Removed rows go `opacity-35 line-through`.

**The gate:** the Copy/Send button is `disabled` while any unsupported sentence remains, labelled `🔒 Locked by the evidence gate`, with the helper line *"The send button stays locked until the unsupported claim is gone."* This is a 15-line change that demonstrates a blocking gate more convincingly than any diagram.

### 3.10 Supporting primitives

`Button` (primary / default / ghost / play / sm), `Chip` (neutral / proof / unproven / blocker / absent-dashed / brand), `Card` (`rounded-card border border-line bg-surface shadow-card`), `Drawer` (right, 460px, `translateX(102%) → 0` over 320ms `cubic-bezier(.22,.9,.28,1)`), `Modal`, `Toast` (bottom centre), `Skeleton`, `EmptyState`.

Card padding is standardised at **18px** (`pad`) or **22px** (`pad-lg`). Nothing else. The current repo oscillates between p-4/p-5/p-6 and it reads as sloppiness at projector scale.

---

## 4. Information architecture

```
/                        Workspace — call list, drop zone, cross-call signals
/search                  Cross-call search — evidence-first results
/upload                  New call
/calls/:id/processing    Processing — stages + gate log
/calls/:id/:view         Call workspace   view ∈ verdict | record | act | brief
/deals/:id               Deal timeline — how this deal moved across calls
/integrations            HubSpot + Slack — evidence-gated CRM sync
/shared/:token           Public read-only report (light-first, editorial)
```

The product's three differentiators are stated on the workspace as three clickable cards, each linking to the view that delivers it. They are not marketing garnish — they are the site map:

| | Claim | Links to |
|---|---|---|
| ① | **Every insight has proof** — click any claim and hear the customer say it | Verdict |
| ② | **Every risk has a reason** — no health score, eight dimensions, each stated / blocked / never mentioned | Deal timeline |
| ③ | **Every call ends with an action** — battlecard and follow-up built only from what was agreed | What to do |

Tagline: *"The call intelligence tool that shows its receipts."*

**The single most important structural change from the current build:** the call workspace is a **two-pane layout with a permanently mounted right rail** containing the audio player and the full transcript.

```
┌──────────────────────────────────────────────┬──────────────────────┐
│  view tabs: Verdict · The record · What to    │  THE RECORDING       │
│             do · Manager brief                │  waveform + moments  │
├──────────────────────────────────────────────┤  + speaker ribbon    │
│                                              ├──────────────────────┤
│  the selected view                           │  TRANSCRIPT          │
│  (single scrolling column of cards)          │  scrollable, always  │
│                                              │  mounted, 37 segs    │
└──────────────────────────────────────────────┴──────────────────────┘
   grid-cols-[minmax(0,1fr)_400px] at ≥1180px · rail is sticky top-[74px]
```

This is not cosmetic. In the current build `TranscriptPanel` is the component that calls `playRange()`, and it only exists on the Transcript tab — so **"Play evidence" is silent from the Insights tab**. Mounting the rail permanently fixes that class of bug structurally: every play button works from every view, and the judge sees the transcript scroll to the cited line at the same moment the audio starts. The simultaneity *is* the demo.

Below 1180px the rail moves under the main column and the player becomes `sticky bottom-4`.

### The four views

| View | Answers | Contains |
|---|---|---|
| **Verdict** *(default)* | "What is true about this deal?" | Verdict sentence · Proof ring + 8 signals · Reality checks · Customer truth · Deal killers · **Refused claims** |
| **The record** | "Show me the call." | Moments · three-axis sentiment · objections + coaching · competitors · conversation metrics |
| **What to do** | "What do I do next?" | Battlecard · commitment ledger · evidence-safe follow-up |
| **Manager brief** | "Tell my boss in 30 seconds." | Manager brief · signals · share + export |

This replaces the current five tabs (Overview / Outline / Transcript / Insights / Call Info). **Delete the Insights tab** — a 12-component vertical dump is the opposite of a point of view. Transcript becomes the rail. Call Info folds into Manager brief.

---

## 5. Screen specs with data bindings

Field paths below are literal keys from `GET /api/v1/calls/{id}/report`.

### 5.1 Workspace `/`

- **Hero**: eyebrow `DEAL TRUTH · WORKSPACE`; h1 in display serif, ~19ch — *"Every claim in here has a receipt."*; the invariant beneath in italic serif.
- **Drop zone**: dashed, with an animated 16-bar live waveform. `hover:border-brand hover:bg-brand-soft`.
- **Call table** ← `GET /api/v1/calls` (`CallSummary[]`). Columns: Customer (`customer_name` + `title`, with `rep_name`/`created_at` beneath) · Rep · Length (`duration_ms`, mono) · What's in the way (a `status` chip + the top deal-killer title) · **Proof pips**.
  - **Proof pips** are 8 tiny 16×5px bars, one per dimension, coloured proven/blocked/weak/not-found. They give the 8-dimension read at list scale and cost nothing. Today this data only exists after loading each report — see `BACKEND_CHANGES.md` §2 for the `signal_pips` field on `CallSummary` that makes this a one-request render.
  - `FAILED` rows are not navigable; show the failure reason inline.
- **Cross-call cards**: "Across your calls this week" (linked saved searches) and **"The gate, this week"** — two large serif numerals, *n claims shipped with proof* / *n claims refused*. That second card is the whole thesis at a glance.

### 5.2 Processing `/calls/:id/processing`

Two cards side by side.

**Stage list** ← `GET /calls/{id}/events` + `GET /calls/{id}/stream` (SSE). Eight rows mapped from `CallStatus`: `QUEUED · TRANSCRIBING · WAITING_FOR_RECAP · ANALYZING · VALIDATING · INDEXING · BUILDING_REPORT · SHIPPED`. Each row: numbered circle → check on completion, a human label, a technical sub-label, and elapsed seconds in mono on the right. Active row gets `bg-brand-soft border-brand-line`.

**Gate log** ← the same event stream, rendered as `<GateLog />`. Every `validate/FAILED` event carries `error_code` and `details.title` — render those as struck-through refusals. This card is the Harness trophy submission.

SSE has a ~30s idle cut-off with no heartbeat and no terminal event on timeout — **reconnection logic is mandatory**, and the client should also poll `GET /calls/{id}` every 1.5s as a floor. Add a 120s stall warning.

### 5.3 Verdict `/calls/:id/verdict`

1. **Verdict card** — display serif 27px, max 34ch, with blockers coloured `blocker` inline. Composed from `report.headline` / `report.tldr`; when recap is unavailable both are `null`, so fall back to a template built from the top deal-killers. Beneath: a chip row of the 8 dimensions, then the invariant in italic serif.
2. **Proof ring + signal board** — `<ProofRing>` left, the 8 `<SignalTile>`s right in a 4-col grid. Header note, right-aligned: *"no close probability — only what was observed."*
3. **Reality checks** ← `report.reality_checks[]`, one `<RealityCheck>` each.
4. **Customer truth** ← `report.customer_truth[]`, two-column card grid. Each card: a category chip (`payload.label` → *Pain / Requirement / Buying signal / Budget / Blocker / Competition / Commitment / Timeline*), an `<EvidenceStamp>` from `evidence_status`, the `title`, the `summary`, one `<EvidenceReceipt>` built from `segment_ids[0]` + `quotes[0]` + `audio_spans[0]`, and a single "Why we think this →" ghost button. **One evidence affordance per card** — do not stack a receipt and a duplicate play button.
5. **Deal killers** ← `report.deal_killers[]`, ordered supported-first. 3px left border: `blocker` for `SUPPORTED`, `absent` for `ABSENCE_BASED`. Absence-based cards show, instead of buttons: *"Not a customer quote — this dimension was never identified on the call."*
6. **Refused claims** ← new endpoint (`BACKEND_CHANGES.md` §1). Card bordered `blocker-line`, headed *"N claims the model wanted to ship. The gate refused all N."* Each refusal is an `EvidenceReceipt`-shaped block with a `BLOCKER` stamp, the mono `error_code`, the claim struck through, and the reason. If the endpoint isn't built in time, render this from `validate/FAILED` entries in `GET /events` — `details.title` and `error_code` are already there.

**Ask the Call placement.** Ask appears in three places, deliberately: a persistent `Ask this call…` input pinned under the transcript header in the right rail (always visible, Enter submits), a full section at the foot of *The record* explaining the retrieval path, and a top-bar shortcut. It is a headline feature and should not live only behind a modal button.

The Ask panel must show **retrieved moments even when generation is off** — `POST /ask` returns `mode ∈ retrieval | generated | retrieval_generation_dropped | retrieval_generation_failed | retrieval_lexical_fallback | no_index`. Render the answer when present and the moments always. Copy for the section: *"Your question is embedded, matched against this call's segments with pgvector, reranked, and answered only from what comes back. If generation is disabled or fails, you still get the moments."*

### 5.4 The record `/calls/:id/record`

- **Moments** ← `report.moments[]`, a clickable list with icon, label, mono timestamp, play button. (Also rendered as the waveform lane in the rail.)
- **"Emotion is not buying intent"** ← `report.sentiment_timeline[]`. A dual-line SVG: dashed saffron for emotion valence, solid green for commercial intent, over a shared time axis. Beneath, a callout receipt on the segment where the two diverge — for the Example call that's 08:42, emotion *frustrated*, intent *positive*. Copy: *"Frustration aimed at the status quo is a buying signal, not a negative one. A single blended sentiment score would have read this backwards."*
  This is a real differentiator and it is currently invisible in the product. The ML service deliberately returns three never-merged axes (`emotion`, `buying_intent`, `deal_signals`); **the UI must never collapse them into one number.** Note the compat `/emotion` route flattens all three axes into one array and loses axis identity — bind against `/v1/emotions` (see `BACKEND_CHANGES.md` §7).
- **Objections** ← `report.objections[]` + `report.coaching[]` joined on `payload.kind`. Each: title, kind chip, summary, receipt, then a `brand-soft` block headed **"Next time, say this"** with the coaching text.
- **Competitors** ← `report.competitors[]`: name, `payload.position` chip, "They like" / "They doubt", receipt from `payload.context`.
- **Conversation metrics** ← `report.metrics`: a talk-ratio bar (brand vs proof), question count, longest monologue, silence gaps, and tracked-term chips with counts. Use `report.metrics` (7 keys), **not** `GET /metrics` (4 keys, and `{}` when uncomputed).

### 5.5 What to do `/calls/:id/act`

- **Battlecard** ← `report.battlecard`. Goal in display serif 21px. Three columns: *Ask these* (`questions_to_ask`, numbered, brand numerals) · *Be ready for* (objections, saffron-tinted, each with a play button) · *Send before <date>* (checkmarked list) plus a dashed "Still unknown" box from `missing_qualification_fields`. Footer: a `blocker-soft` warning strip from `warning`.
  ⚠ **Do not render `battlecard.documents_to_send` as a document list** — it currently maps to the raw full text of every seller commitment. Derive the send-list from `commitments` where `payload.side === 'seller'` instead, or fix it server-side.
- **Commitment ledger** ← `report.commitments[]` split by `payload.side`. Two columns, *Your team* / *The customer*. Each item tinted by status: committed → `proof`, no date → `unproven`, not committed → `blocker`; with owner · due text and a play button. The section header carries a `blocker` chip: **"customer has not committed to a next meeting"** whenever `next_meeting_committed` is absent.
- **Evidence-safe follow-up** ← `report.follow_up.sentences[]`, rendered as `<EmailSentence>` rows with the locked-send gate. Header chip: *"N unsupported claims"* (blocker) or *"every sentence has a receipt"* (proof).
  ⚠ `follow_up.unsupported_claims` is hardcoded `[]` today. Derive the unsupported set from `sentences[].supported === false && kind === 'FACT'`, or implement the field server-side.

### 5.6 Manager brief `/calls/:id/brief`

Two columns, *Why they buy* (`manager_brief.why_they_buy`, green dots) / *Why they don't* (`why_they_do_not`, red dots). Then two tinted panels: **Biggest risk** (`biggest_risk`) and **Next move** (`recommended_next_move`). A chip row summarising `customer_commitment`, missing dimensions, and the shipped/refused claim counts. Then the signal board again, and the share card.

Copy and Export (`/export/markdown`, `/export/json`) live here.

### 5.7 Search `/search`

Cross-call, and deliberately **evidence-first**: a search result is not a document link, it is a moment somebody said, rendered as an `<EvidenceReceipt>` with a play button. That single decision is what makes search feel like part of this product rather than a stock feature.

- Large input (52px, 16px text), autofocused, filtering on every keystroke. Suggestion chips beneath: `no next step · security · pricing · competitor · commitment · budget`.
- Results header: *"N results across M calls"* with a `n spoken moments · n validated insights` sub-count.
- **Validated insights** group first — each row carries a call chip, a type chip, an `<EvidenceStamp>`, the title, and the summary. Clicking opens the call and plays the cited segment.
- **Spoken moments**, grouped by call. Each is a full receipt. Calls with audio get a `proof` chip reading *audio available*; others show *transcript only* and an "Open call →" button instead of play. Never fake a play button that produces silence.
- The matched substring is wrapped in `<mark>` with a `saffron-200` background.
- **No results** is rendered in the absence style, not as an error: *"Nothing in any transcript matches "X". We return no result rather than a loose one."* Consistent with the invariant — the product would rather return nothing than something unproven.

Data: `GET /api/v1/search?q=` returns `{query, groups: {insights, segments, calls}, total}` with per-group `limit` (default 10, max 50), and optional `status`, `from`, `to`, `call_id`, `speaker_role`, `types` filters. There is **no pagination and no snippet highlighting server-side** — highlight client-side. Note `groups.segments[]` already carries `start_ms`/`end_ms`/`speaker_role`, so receipts render without a second fetch.

The workspace's "Across your calls this week" rows are saved searches — each navigates here with a pre-filled query.

### 5.8 Deal timeline `/deals/:id`

**The one screen a sales manager will actually ask for**, and the answer to "is this deal getting better or worse?" — without inventing a score.

The design constraint: your architecture doc explicitly refuses close probability, so a 0-100 health line would contradict the rest of the product. The resolution is to plot something **countable**. For each call, count how many of the 8 dimensions were *proven on that call* and how many were *blocked*. Both numbers are auditable, both are clickable down to a quote, and the chart has exactly the same shape and answers exactly the same question a health score would.

Sections, top to bottom:

1. **Header** — account, contact, rep, call count, span in days. Primary action opens the latest call.
2. **The finding, in display serif** — e.g. *"This deal peaked eight days ago. It has since lost its timeline and its next meeting, and gained a security blocker."* Beneath it, the italic line: *"No health score. Every point on this chart is a dimension somebody either stated or didn't."*
3. **Trend chart** — two polylines over the calls, `proof` for dimensions proven and `blocker` for dimensions blocked, y-axis 0–8 with gridlines, value labels above each point, call dates on the x-axis. Points are clickable.
4. **The change matrix** — an 8 × N table, dimensions down, calls across. Each cell is a mono pill: `proven` (green) / `blocked` (red) / `not found` (dashed grey). **Any cell that changed state since the previous call gets a saffron ring.** The current call's column is tinted. This table is more informative than the chart and costs nothing to build.
5. **What moved backwards** — one card per regression, each showing `was proven → now blocked`, the reason, and either a play button on the moment it changed or, where the change is an *absence*, the honest line: *"Nothing was said on this call — there is no clip to play. That is the finding."* A dimension silently disappearing between calls is exactly the failure this product exists to catch.
6. **Calls in this deal** — a list with per-call proven / blocked / not-found counts.

**Backend dependency:** no deal or account object exists today; calls are standalone. See `BACKEND_CHANGES.md` §3 for the minimum grouping needed. Until it exists, group client-side on `customer_name`.

### 5.9 Integrations `/integrations`

The invariant applied to the system of record. Headline: **"Nothing reaches your CRM without a receipt."**

- **Status card** — hero, plus an `Integration service · operational` proof chip and a note that credentials never touch the browser.
- **HubSpot card** (`proof`-bordered when connected) — the five actions, each with a check or an ✕ and a one-line explanation. `Log completed meeting` shows an ✕ on this call, with the reason.
- **Slack card** (`unproven`-bordered until configured) — alert types, a webhook input validated against `https://hooks.slack.com/`, and the honest note: *"The webhook is stored server-side. This app never keeps it in the browser, and never sends it with HubSpot requests."*
  Two alert types worth adding beyond the obvious: **Claim refused** (the evidence gate blocked something) and **Dimension lost** (a dimension proven on the previous call disappeared on this one). Both are free given the data model and both are things a sales manager would actually want pushed at them.
- **"Why this is different" card** — three tiles: Written (n fields carry a segment) / Left to you (n not knowable from a call) / Refused (n blocked, with the reason).

#### The send dialog — the part that matters

Reached from `Send to HubSpot` in the call header, from the CRM card at the top of *What to do*, or from the Integrations page. It is a **field-by-field table with provenance**, not a form.

Every field falls into exactly one of three states:

| State | Rendering | Example |
|---|---|---|
| **`SUPPORTED`** | `proof` tint, `✓ PROVEN` stamp, value prefilled, a **play button with the timestamp**, and a Skip toggle | *Call note · why they buy* → "Manual routing costs about 6 hours a week…" ▶ 8:42 |
| **`MANUAL`** | `unproven` tint, `you must enter this` chip, **left blank** with a reason | *Deal amount* → "No amount was agreed. $800/mo was quoted by the rep and the customer said it was almost double what they pay. We will not write a number nobody accepted." ▶ 21:14 |
| **`BLOCKED`** | `blocker` tint, `! BLOCKER` stamp, disabled, **not overridable from this dialog** | *Log completed meeting* → "The customer refused to commit to a next meeting. Writing one would create a commitment that does not exist." ▶ 34:51 |

Header carries live counts: `n fields with evidence · n need you · n refused`. The submit button reads **"Send n verified fields"** and updates as fields are skipped. Footer: *"Blocked fields cannot be overridden from here. To log a meeting, get the customer to agree to one on a call."*

Why this is the strongest integration story available: every other conversation tool writes whatever the model produced straight into the CRM, so the CRM inherits the hallucinations. Deal Truth refuses per field, and shows the quote behind every field it does write. It is the same gate the audience already watched block the follow-up email, now operating on the system of record — which is what makes it land rather than feel like a repeat.

`MANUAL` is deliberately not a failure state. Deal amount, pipeline stage and close date are **not knowable from a conversation**, and saying so plainly is more credible than guessing.

### 5.10 Shared report `/shared/:token`

Light-first, narrow (940px), editorial. This is what a customer or a VP opens; it should look like a typeset briefing, not an app. Tricolour rule as a rounded bar at the top of the first card, the proof ring in the header, then: what the customer actually said (4 receipts) → the primary reality check → the signal board. Footer: *"Generated by Deal Truth · open source · runs on PyAI."*

Evidence must remain playable here — `GET /shared/{token}` returns `{report, transcript}`, and audio streams via the signed public URL, so this works without auth. A shared report where a stranger can press play and hear the customer is the most viral artefact the product has.

---

## 6. Motion — the choreographed chain

There is exactly one interaction worth animating well, and it is the one the demo turns on. When a user clicks **Play evidence** on any claim, five things happen together:

1. `t=0ms` — the receipt gets `ring-2 ring-proof`.
2. `t=0ms` — the transcript rail scrolls the cited segment to centre (`behavior:'smooth'`) and the segment gets `bg-proof-soft` plus a one-shot `animate-pulse1` ring.
3. `t=60ms` — the waveform playhead moves to `start_ms`; a translucent `proof` evidence band scales in over `start_ms → end_ms`.
4. `t=80ms` — audio plays.
5. `t=80ms→end` — the quote text fills left-to-right with a saffron karaoke highlight, driven by `requestAnimationFrame` against elapsed/duration, applied identically to the receipt and the transcript row.

Implement the highlight as a CSS custom property so it costs one style write per frame:

```css
.karaoke{
  background: linear-gradient(90deg,
    rgb(255 153 51 / .32) var(--k, 0%), transparent var(--k, 0%));
  border-radius: 3px; transition: background .12s linear;
}
```

Everything else stays restrained: cards `animate-rise` on mount with 40–60ms stagger; the drawer slides 320ms; stamps stamp; the proof ring draws its spokes once. **No page transitions, no parallax, no scroll-jacking.** Honour `prefers-reduced-motion` by collapsing all durations to 0.01ms.

---

## 7. States

| State | Treatment |
|---|---|
| **Loading** | Skeletons matching final layout. Never a spinner on a full page. |
| `status` non-terminal | Redirect to `/processing`. `/report` returns **409 `NOT_READY`** with `details.status` — this is expected, not an error; do not surface it as a failure. |
| `PARTIAL` | Render everything available; show a saffron banner naming the degraded section from `report.warnings[]` (e.g. `PYAI_RECAP_FAILED` → "Baseline summary unavailable — extraction and evidence are unaffected."). The transcript is never destroyed by a partial failure. |
| `FAILED` | Error state with `failure_kind` and the named `error_code`, plus a Retry that calls `/process`. |
| **Empty section** | Say what is absent and why, in the absence style. Never "No data". |
| **Blob missing** | `/report` degenerates to `{call_id, public_call_id, status, headline: null, insights: []}` — note the key is `insights`, which does not exist in a real report. Detect and show a "Report artefact missing — re-analyse" state. |
| **ML degraded** | Emotion axes can legitimately return empty arrays (a known Qwen prompt-echo failure mode). Treat empty as a normal degraded state with a note, not an error. |
| **Ask, no index** | `mode ∈ retrieval_lexical_fallback \| no_index` returns moments with **`start_ms: null`** — render those without play buttons rather than crashing. |

---

## 8. Accessibility

- Contrast: all semantic pairs are ≥ 4.5:1 in both themes; verify `unproven` on `unproven-soft` in light (`#C2500A` on `#FFF7ED` = 5.6:1 ✓) and `proof` on `proof-soft` in dark.
- **Never encode state in colour alone.** Every state also carries a glyph and a word: `✓ PROVEN`, `∅ NOTHING SAID`, `! BLOCKER`. Dashed borders do the same job for absence.
- Play buttons: `aria-label="Play evidence, {speaker} at {time}"`. Announce playback start via a polite live region.
- Drawer: focus trap, `Esc` closes, focus returns to the trigger.
- Transcript segments are `<button>`s in a list, keyboard reachable, `aria-current` on the focused one.
- Full keyboard path for the demo: `Tab` to a claim → `Enter` plays → `Esc` closes the drawer. `Cmd/Ctrl+D` toggles theme.
- Target sizes ≥ 32px; the 16px waveform ticks get an invisible 32px hit area.

---

## 9. Copy rules

The writing carries as much of the positioning as the visuals.

- Say **proven**, not "high confidence". Say **the customer never said this**, not "insufficient data".
- Headlines are declarative sentences with a verb — *"The rep booked a close the customer never agreed to."* Not *"Intent Mismatch Detected"*.
- Never use the word *hallucination* in the UI. Demonstrate the gate; don't apologise for models.
- Absence copy is confident: *"We report the gap instead of guessing."*
- Refusal copy is proud: *"4 claims the model wanted to ship. The gate refused all four."*
- Keep the em-dash count low and let the mono quotes do the drama.

---

## 10. Build order

If time runs short, this is the order that protects the demo:

1. Tokens + dark mode + the three fonts. *(Everything inherits from this.)*
2. `EvidenceStamp`, `EvidenceReceipt`, the play chain with the karaoke highlight.
3. The two-pane call workspace with the permanently mounted transcript rail.
4. Verdict view: verdict card → proof ring + signals → **Reality Check**.
5. The locked follow-up email.
6. Refused claims card.
7. Processing + gate log.
8. Search (evidence-first results) + the transcript filter row in the rail (search + speaker toggle — the current build has both and they should not be lost).
9. Integrations + the evidence-gated send dialog.
10. Deal timeline.
11. Shared report.
12. The record view, Manager brief, Workspace polish.

Items 2–5 are the demo. Everything after item 6 is upside — though **Search is the one item that will be noticed if it's missing**, because the current build already has it and judges will type into the box.
