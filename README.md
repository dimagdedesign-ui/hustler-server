# AI Business Analyst

Paste a URL, get a grounded business audit. The pipeline scrapes real signals,
calls Google PageSpeed, runs a 5-agent Anthropic pipeline, and renders a
dynamic interactive report in the Nova design system with a sun/moon theme.

## What's grounded vs. what's inferred

The report is **only as honest as the signals we can collect**. To avoid the
hallucination patterns the design handoff originally had, every section now
declares its data source.

| Section | Source | Typical confidence |
|---|---|---|
| Core Web Vitals + Perf score | Google PageSpeed Insights (live) | High |
| Tech stack | Scraped from DOM / script tags | High |
| SEO checks | Computed from DOM (title, meta, alt, schema, H1) | High |
| SKU count | Counted from `/products/*` links | High when detected |
| Review count | `aggregateRating` JSON-LD (only when present) | High / absent |
| Blog velocity | `/blog`, `/news` probe + `<time datetime>` | High when blog exists |
| E-E-A-T + GEO scores | LLM, referencing snapshot signals | Medium |
| Lean Canvas | LLM-inferred from body text + tech stack | Medium |
| Competitors (5 cards) | **LLM suggested, qualitative only** — no scraped per-competitor data | Medium |
| Brand voice | LLM-inferred from body text style | Medium |
| 50 ICE-scored actions | LLM synthesised from all prior agents | High |

Intentionally **dropped** (couldn't ground with existing tools): SOV rank,
per-competitor DA/velocity/review counts, 2D competitor positioning matrix,
UGC volume, press-tier, revenue-impact predictions, keyword rank claims.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=...
# Optional: PAGESPEED_API_KEY= (raises free quota from 25 → 25,000 req/day)
# Optional: MAKE_WEBHOOK_URL= (forward email captures)
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Endpoints

- `GET  /`              → frontend (intake → pipeline → report)
- `POST /api/analyse`   → JSON `{ ok, report }` — full typed report
- `POST /api/analyse/md`→ runs pipeline, returns `.md` attachment
- `POST /api/analyse/export` → body `{ report }` → `.md` attachment (no re-run)
- `POST /api/leads`     → forwards `{ email, businessUrl, businessName }` to `MAKE_WEBHOOK_URL`
- `GET  /health`        → liveness probe

## Architecture

```
┌────────────┐   POST /api/analyse   ┌──────────────────────────────────┐
│  intake.jsx│ ───────────────────▶ │ routes/analyse.js                │
│ (URL form) │                       │   1. validate URL                │
└────────────┘                       │   2. scrape + PageSpeed (parallel)│
                                     │   3. BM / CP / DP agents (parallel)│
┌────────────┐ ◀─── ok, report ───── │   4. Checklist agent              │
│pipeline.jsx│                       │   5. Assembler (exec, maturity,   │
│ (animated) │                       │      SWOT, strategy, docs)        │
└────────────┘                       └──────────────────────────────────┘
                                                    │
                                                    ▼
                                       ┌───────────────────────────┐
                                       │ typed Report JSON         │
                                       │ { meta, scrape,           │
                                       │   executive, maturity,    │
                                       │   businessModel,          │
                                       │   competitor,             │
                                       │   digital: { eeat, geo,   │
                                       │     brand, keywordSeeds,  │
                                       │     topScores, pageSpeed},│
                                       │   swot, strategy, docs,   │
                                       │   checklist, methodology }│
                                       └───────────────────────────┘
                                                    │
                                                    ▼
                                       ┌───────────────────────────┐
                                       │ report-*.jsx components   │
                                       │ bind directly to JSON     │
                                       └───────────────────────────┘
```

## Deploy to Render

This repo ships with `render.yaml` — a Blueprint that spins up the web service.

1. `git add . && git commit -m "initial"` (already `git init`'d)
2. Create a GitHub repo and `git remote add origin … && git push -u origin main`
3. In [Render](https://dashboard.render.com) → **New → Blueprint** → pick the repo
4. Render reads `render.yaml`, prompts for the secret env vars:
   - `ANTHROPIC_API_KEY` (required)
   - `PAGESPEED_API_KEY` (optional, raises PSI quota)
   - `MAKE_WEBHOOK_URL` (optional)
   - `ALLOWED_ORIGIN` (optional, locks CORS)
5. Click Apply. Health check is `/health`.

**Plan note:** `render.yaml` pins `plan: starter` ($7/mo). The pipeline takes
45–90s; the free tier sleeps after 15 min of idle + has a short request
timeout — the first analysis after a sleep will time out. Change to `free`
at your own risk, or use a paid plan.

**Region:** default is `frankfurt`; edit `render.yaml` if your users are elsewhere.

## Development notes

- Rate limited to **3 analyses per IP per hour** (same as Cinnaboner).
- PageSpeed failing is **non-blocking** — rest of the report still renders,
  Perf score displays "Not measured".
- Every agent returns STRICT JSON. `utils/jsonCall.js` extracts the JSON
  even if the model slips in a stray sentence.
- All agent prompts reference `snapshot` explicitly — they are instructed to
  output "Not detectable" rather than fabricate when a signal is missing.
- Frontend is vanilla React via CDN + Babel standalone, consistent with the
  design handoff. No bundler.

## File map

```
server.js                          entry
routes/
  analyse.js                       POST /api/analyse (+ /md, /export)
  leads.js                         POST /api/leads
agents/
  businessModel.js                 → LeanCanvas + UnitEcon (JSON)
  competitor.js                    → 5 competitors (JSON, qualitative)
  digitalPresence.js               → E-E-A-T + GEO + Brand + Keyword seeds
  checklist.js                     → 50 ICE-scored items (JSON)
services/
  scraper.js                       cheerio + axios — grounded signals only
  pagespeed.js                     Google PageSpeed API wrapper
prompts/
  systemBase.js                    context block + UNIVERSAL / JSON rules
  businessModel.js / competitor.js / digitalPresence.js / checklist.js
  assembler.js                     exec · maturity · SWOT · strategy · docs
utils/
  jsonCall.js                      safe JSON call + extraction
  detectUserType.js                manufacturer vs. service_provider
  reportAssembler.js               builds the typed Report object
  reportToMarkdown.js              serialises Report → .md for download
public/
  index.html                       app shell + stage transitions
  app.css / extras.css             Nova DS + new component styles
  colors_and_type.css              DS tokens (light + dark)
  topbar.jsx                       shared header
  intake.jsx                       URL form
  pipeline.jsx                     animated progress during API call
  report-shell.jsx                 left nav
  report-summary.jsx               exec summary + maturity + Lean Canvas
  report-competitors.jsx           1D threat bar + 5 cards
  report-digital.jsx               digital + brand + strategy + SWOT + docs + methodology
  report-checklist.jsx             50-item interactive checklist
```
