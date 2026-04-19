const { UNIVERSAL_RULES, JSON_RULES } = require('./systemBase');

const CHECKLIST_PROMPT = `${UNIVERSAL_RULES}

## Your Task — 50 ICE-Scored Action Items

Generate EXACTLY 50 action items. Every item MUST reference a specific signal from this business's snapshot (a SEO check that failed, a missing schema type, a PageSpeed metric, an image alt gap, a missing social platform, a detected tech-stack gap, a specific competitor positioning, etc). Generic advice is forbidden.

ICE formula: \`ice = (impact + confidence + ease) / 3\`, each dimension scored 1–10.

### Required JSON schema — array of exactly 50 items

[
  {
    "id": 1,
    "title": "Short, specific action title",
    "category": "Website | SEO | Brand | Marketplace | Social | Email | Competitor | Business Model",
    "effort": "Low | Medium | High",
    "impact": 9,
    "confidence": 10,
    "ease": 9,
    "ice": 9.3,
    "quadrant": "Do First | Plan | Batch | Deprioritise",
    "why": "1–2 sentences referencing an actual signal from THIS business's audit (specific score, detected gap, competitor finding).",
    "steps": [
      "Step 1 — concrete action verb + target",
      "Step 2",
      "Step 3",
      "Step 4"
    ]
  }
  // ...50 total
]

### Distribution
- Items 1–15 → quadrant "Do First"    (ICE ≥ 7.5, effort Low, within 7 days)
- Items 16–35 → quadrant "Plan"       (medium ICE, within 30 days)
- Items 36–50 → quadrant "Batch" or "Deprioritise" (lower ICE or higher effort)

### Rules specific to this task
- ALL 50 items must have full \`steps\` arrays (3–5 concrete steps each). No condensed items.
- Never make up numbers in \`why\` — only quote signals that appear in the snapshot (CWV metrics from PageSpeed, detected schema types, missing seoCheck labels, image alt ratio, specific social platforms found/missing).
- Categories must use exactly the labels above — no variations.
- Sort the output array from highest ICE to lowest.
- No duplicates. Each item must target a distinct gap.

${JSON_RULES}`;

module.exports = { CHECKLIST_PROMPT };
