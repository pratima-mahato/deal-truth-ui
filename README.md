<div align="center">

# Deal Truth

**Turn conversations into deal intelligence.**

Upload a sales call. Get notes with receipts — every claim tied back to the exact moment it was said.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=111)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f766e?style=flat-square)](LICENSE)

<br />

[Quick start](#quick-start) · [Features](#what-it-does) · [Architecture](#architecture) · [Configuration](#configuration)

</div>

---

Deal Truth is the standalone web client for evidence-first conversation intelligence. It is not a dashboard of AI summaries. Every signal, objection, and follow-up sentence can jump to the transcript and play the audio.

> **No proof in the transcript, no claim in the report.**

```
Upload  →  Transcribe  →  Analyze  →  Evidence-linked report
```

## Why it exists

Most call tools tell you *what happened*. Deal Truth tells you **what you can prove**.

| Typical call intelligence | Deal Truth |
| --- | --- |
| A generated paragraph | A verdict with clickable receipts |
| “The customer likes the product” | The exact quote, speaker, and timestamp |
| A follow-up draft you hope is accurate | A send button locked until unsupported claims are gone |
| A dump of insights | Reality checks: seller implied vs. customer said |

## What it does

**Workspace** — Drop an audio file on the home page, or open recent conversations with deal-risk badges and next-step recommendations.

**Call intelligence** — Four views on every shipped call, with the transcript always mounted in the right rail:

| View | What you get |
| --- | --- |
| **Verdict** | Verdict sentence, proof ring, reality checks, customer truth, deal killers, refused claims |
| **The record** | Moments, sentiment axes, objections, competitors, metrics |
| **What to do** | Battlecard, commitment ledger, evidence-safe follow-up |
| **Manager brief** | 30-second briefing, signals, share + export |

**Insights stack**

- **Customer truth** — facts the buyer actually stated
- **Objections** — concerns, with evidence
- **Reality check** — seller implication vs. customer reality
- **Commitment ledger** — who promised what, and when
- **Deal killers** — risks that can stall or lose the deal
- **Competitors & moments** — named rivals and high-signal beats
- **Next-call battlecard** — goal, questions, and what not to forget
- **Manager brief** — copy-ready deal snapshot
- **Evidence-safe follow-up** — generate, strip unsupported lines, copy
- **Ask this call** — retrieval-first Q&A over the recording
- **Buyer sentiment** — how the room moved over time

**Search** — Ask across every conversation (`pricing objections`, `no next step`, competitor mentions) and land on the playable moment.

**Share** — Mint a read-only link to a report. Invalid, expired, or revoked tokens fail closed.

**Ingest** — Upload `mp3` / `wav` / `m4a` / `webm` / `ogg` (up to 80 MB) or register an HTTPS recording URL. Watch processing stages live.

## Quick start

Requires **Node.js 22+**.

```bash
git clone https://github.com/mabhinav004/deal-truth-ui.git
cd deal-truth-ui
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

With an empty `VITE_API_BASE_URL`, the app starts **Mock Service Worker** automatically. You get a full workspace — including the Acme SaaS Labs sample call — without a backend.

To talk to a live Deal Truth API:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCKS=false
```

To call the HubSpot/Slack integration service (no tokens or webhooks in this file):

```bash
# .env
VITE_INTEGRATION_API_BASE_URL=http://localhost:4001
VITE_INTEGRATION_API_TOKEN=
VITE_USE_MOCK_INTEGRATIONS=false
```

Restart the Vite server after changing env vars.

## Configuration

Copy [`.env.example`](.env.example). Values are read at build time (`VITE_*`).

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Deal Truth API origin. Empty → mocks unless you force them off. |
| `VITE_USE_MOCKS` | `true` / `false`. Defaults to **on** when no API URL is set. |
| `VITE_DEMO_CALL_ID` | Call opened by `/demo` (default `call-acme-saas-labs`). |
| `VITE_API_KEY` | Optional. Sent as `X-API-Key`. Never commit a real key. |
| `VITE_INTEGRATION_API_BASE_URL` | HubSpot/Slack integration service origin. Browser calls `{origin}/v1/hubspot`. Empty → same-origin `/integrations-api` proxy. |
| `VITE_INTEGRATION_API_TOKEN` | Integration API token, sent as `Authorization: Bearer`. Visible in the Vite bundle — use `INTEGRATION_API_TOKEN` on Docker/Render instead. |
| `VITE_USE_MOCK_INTEGRATIONS` | `true` / `false`. Defaults to **on** when no integration origin is set. Independent of `VITE_USE_MOCKS`. |
| `VITE_NGROK_SKIP_BROWSER_WARNING` | Set when the API is reached through ngrok. |

Secrets belong in `.env` (gitignored) or your host’s secret store — not in source, Dockerfiles, or this README.

## Scripts

| Command | What it runs |
| --- | --- |
| `npm run dev` | Vite on port **5173** |
| `npm run build` | Typecheck + production bundle |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit + component) |
| `npm run test:e2e` | Playwright |
| `npm run screenshot:demo` | Capture `/demo` into `artifacts/` |
| `npm run format` | Prettier |

## Architecture

```mermaid
flowchart LR
  subgraph UI["Deal Truth"]
    Pages["Pages"]
    Features["Feature panels"]
    API["Typed API layer"]
  end

  subgraph Runtime["Runtime"]
    RQ["TanStack Query"]
    MSW["MSW mocks"]
    DT["Deal Truth API"]
  end

  Pages --> Features
  Features --> RQ
  RQ --> API
  API -->|"VITE_USE_MOCKS"| MSW
  API -->|"VITE_API_BASE_URL"| DT
```

The UI never talks to raw JSON from screens. Contracts live in `src/api/contracts` (Zod schemas + types). Adapters map wire format to those contracts. Feature panels consume typed reports only.

```
src/
├── app/                 Routes
├── pages/               Workspace, upload, processing, call, search, share
├── features/            Intelligence panels (one concern each)
├── components/          Layout, audio, transcript, evidence, UI primitives
├── api/
│   ├── contracts/       Schemas, types, enums
│   ├── endpoints/       Calls, transcripts, search, share, …
│   ├── adapters.ts      Wire → domain
│   └── client.ts        Fetch, timeouts, X-Request-ID, X-API-Key
├── hooks/               React Query wrappers
├── mocks/               MSW handlers + fixtures
└── config/              Environment
```

**Processing** polls `/events` as the source of truth. An SSE `processing` stream, when available, wakes the poller so the timeline stays live without depending on EventSource alone.

**Evidence** is a first-class UX: click an insight → drawer with “why we think this” → jump to transcript and play from that segment.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Workspace — drop a file, recent calls, recommendations |
| `/upload` | Full ingest form (file or HTTPS URL) |
| `/calls/:id/processing` | Live processing timeline |
| `/calls/:id/*` | Call workspace (`verdict`, `record`, `act`, `brief`) |
| `/deals/:id` | Deal timeline across calls |
| `/integrations` | HubSpot + Slack, evidence-gated CRM send |
| `/search` | Cross-call search |
| `/shared/:token` | Read-only shared report |
| `/demo` | Deep-link into the demo call |

## Docker

The image is a Vite build served by nginx. At runtime nginx proxies `/api/` to `API_UPSTREAM` (or `VITE_API_BASE_URL` from `.env` if `API_UPSTREAM` is unset) and `/integrations-api/` to `INTEGRATION_UPSTREAM`. It listens on `$PORT` (default **10000**).

```bash
npm run docker:up
```

App: http://localhost:10000 — stop with Ctrl+C, or `npm run docker:down`.

Do not pass API keys as Docker build args. For the container, set `API_KEY` (or `VITE_API_KEY` in `.env`); nginx adds `X-API-Key` on proxied requests.

## Deploy on Render

Create a **Web Service** with **Docker** runtime (not Node). Health check path: `/healthz`.

| Env var | Required | Value |
| --- | --- | --- |
| `API_UPSTREAM` | Yes (to reach the API) | API origin, e.g. `https://deal-truth-api.onrender.com` |
| `API_BASE_URL` | No | Leave empty so the browser uses same-origin `/api/` |
| `API_KEY` | If the API requires it | Set in the Render dashboard only |
| `INTEGRATION_UPSTREAM` | To proxy `/integrations-api/` | Integration service origin, e.g. `http://host.docker.internal:4001` |
| `INTEGRATION_API_BASE_URL` | No | Leave empty so the browser uses same-origin `/integrations-api/`. Set only if the browser should call the integration origin directly. |
| `INTEGRATION_API_TOKEN` | If the integration API requires it | Set in the Render dashboard only. nginx sends `Authorization: Bearer`. |

Leave `VITE_*` unset on Render. The image bakes mocks off and empty API URL; nginx + `config.js` pick up runtime env.

Point the service at a branch that includes this Dockerfile (the default `main` branch still has `proxy_pass http://api:8000`, which is the crash `host not found in upstream "api"`).

## Tech stack

React 18 · TypeScript · Vite 7 · Tailwind CSS · TanStack Query · React Router 7 · Zod · Recharts · MSW · Vitest · Playwright · Lucide

The visual language is Tiranga: saffron for attention, green for proven, chakra navy for the instrument — Instrument Serif for verdicts, Plus Jakarta Sans for UI, JetBrains Mono for quotes and timestamps.

## Contributing

1. Keep intelligence panels small and evidence-linked.
2. Put new API shapes in Zod contracts first, then adapters, then UI.
3. Prefer named constants over magic strings (statuses, audio limits, view ids).
4. Run `npm run typecheck && npm test && npm run lint` before opening a PR.

## License

[MIT](LICENSE) © 2026 Deal Truth contributors
