/**
 * Focused sub-prompts used by the assembler to generate the cross-cutting
 * sections (executive summary, maturity, SWOT, business docs, strategy).
 *
 * Each returns structured JSON (not markdown).
 */
const { UNIVERSAL_RULES, JSON_RULES } = require('./systemBase');

const EXECUTIVE_PROMPT = `${UNIVERSAL_RULES}

## Your Task — Executive Summary

Write 3–5 bullets summarising the audit. Each bullet is tagged:
- "win"    → something the business is doing well (asset)
- "risk"   → a concrete gap with evidence
- "action" → the single highest-leverage next move

### Required JSON schema

{
  "bullets": [
    { "kind": "win | risk | action", "text": "1–2 sentences, referencing a specific finding from the prior agents or snapshot." }
    // 3 to 5 items
  ]
}

### Rules
- At least 1 win, at least 1 risk, exactly 1 action.
- Every bullet must reference a concrete signal (a score, a missing schema, a specific competitor, a PageSpeed metric).
- Action bullet may suggest a directional outcome ("expected to improve mobile conversion") but must NOT fabricate specific figures.

${JSON_RULES}`;

const MATURITY_PROMPT = `${UNIVERSAL_RULES}

## Your Task — Maturity at a Glance

Score 3 dimensions on a 0–4 stage:
- Web Presence:   0=no site, 1=basic, 2=optimised, 3=SEO-structured + fast, 4=full DTC engine
- Brand & Media:  0=no presence, 1=basic logo, 2=consistent identity, 3=documented voice + audience, 4=content flywheel
- Overall Health: average of the above two, rounded down

### Required JSON schema

{
  "rows": [
    { "dimension": "Web Presence",   "stage": 0, "level": "string label for the stage", "assessment": "one sentence referencing scraped signals + PageSpeed." },
    { "dimension": "Brand & Media",  "stage": 0, "level": "...", "assessment": "..." },
    { "dimension": "Overall Health", "stage": 0, "level": "...", "assessment": "..." }
  ]
}

${JSON_RULES}`;

const SWOT_PROMPT = `${UNIVERSAL_RULES}

## Your Task — SWOT

2×2 SWOT. Every bullet must be specific to this business and reference a signal from the findings.

### Required JSON schema

{
  "strengths":      ["b1", "b2", "b3"],
  "weaknesses":     ["b1", "b2", "b3"],
  "opportunities":  ["b1", "b2", "b3"],
  "threats":        ["b1", "b2", "b3"]
}

${JSON_RULES}`;

const STRATEGY_PROMPT = `${UNIVERSAL_RULES}

## Your Task — 30-Day Action Plan

Structured plan broken into 3 tight phases that fit in one month, plus 4 KPI targets.

### Required JSON schema

{
  "phases": [
    { "name": "Week 1 — Foundations",      "bullets": ["b1", "b2", "b3"] },
    { "name": "Weeks 2–3 — Build",          "bullets": ["b1", "b2", "b3"] },
    { "name": "Week 4 — Ship & measure",    "bullets": ["b1", "b2", "b3"] }
  ],
  "kpis": [
    { "name": "KPI name", "target": "Specific 30-day target. Prefer directional (reach 80% alt-text coverage) over invented absolutes. No fabricated baselines." }
    // exactly 4 kpis
  ]
}

### Rules
- Bullets must each reference a specific snapshot signal.
- Keep scope realistic for 30 days — "launch" a new vertical takes months, but "publish the landing page + 3 BOFU articles + wire the CTA" fits.
- KPI targets: prefer directional ("double blog output", "reach 80% image alt coverage") over absolute figures, unless a baseline was scraped.

${JSON_RULES}`;

const DOCS_PROMPT = `${UNIVERSAL_RULES}

## Your Task — Strategy Documents (6 short docs)

Each doc is a short markdown string (<180 words) tailored to this business.

### Required JSON schema

{
  "visionMission":     "markdown with ## Vision, ## Mission, ## Core Values",
  "icp":               "markdown with ## Demographics, ## Psychographics, ## Pain Points, ## Where They Spend Time",
  "monetisation":      "markdown with ## Revenue Model, ## Primary Streams, ## Pricing Strategy, ## Expansion Opportunities",
  "sales":             "markdown — 3 concrete revenue channels as ### Channel headings with 2–3 tactics each",
  "brandVoiceGuide":   "markdown — ## Tone of Voice (4 adjectives), ## Brand Personality (2 sentences), ## Key Messages (3 bullets), ## Do (5 rules), ## Don't (5 rules), ## Example Phrases (3)"
}

### Rules
- Every doc must reference this business's specific niche and findings from the snapshot. No generic text.
- No invented statistics.

${JSON_RULES}`;

module.exports = {
  EXECUTIVE_PROMPT,
  MATURITY_PROMPT,
  SWOT_PROMPT,
  STRATEGY_PROMPT,
  DOCS_PROMPT,
};
