const { UNIVERSAL_RULES, JSON_RULES } = require('./systemBase');

const BUSINESS_MODEL_PROMPT = `${UNIVERSAL_RULES}

## Your Task — Lean Canvas + Unit Economics

Produce a Lean Canvas and Unit Economics estimate for this business, strictly from the snapshot.

### Required JSON schema

{
  "canvas": [
    { "key": "Problem",               "conf": "high|medium|low", "text": "..." },
    { "key": "Customer Segments",     "conf": "...", "text": "..." },
    { "key": "Unique Value Proposition", "conf": "...", "text": "..." },
    { "key": "Solution",              "conf": "...", "text": "..." },
    { "key": "Channels",              "conf": "...", "text": "..." },
    { "key": "Revenue Streams",       "conf": "...", "text": "..." },
    { "key": "Cost Structure",        "conf": "...", "text": "..." },
    { "key": "Key Metrics",           "conf": "...", "text": "..." },
    { "key": "Unfair Advantage",      "conf": "...", "text": "..." }
  ],
  "unitEcon": {
    "aov":            { "value": "£XX or $XX or 'Not detectable'",     "conf": "...", "note": "..." },
    "priceRange":     { "value": "Low | Mid | Premium + example",      "conf": "...", "note": "..." },
    "revenueTier":    { "value": "Low (<£50k) | Mid (£50k–£300k) | High (£300k+)", "conf": "...", "note": "..." },
    "reviewVelocity": { "value": "~X/month or 'Not detectable'",       "conf": "...", "note": "..." }
  }
}

### Rules specific to this task
- Each canvas block \`text\` must be 1–2 sentences, specific to THIS business, referencing a scraped signal (SKU count, marketplace presence, tech stack, body text phrases).
- If the snapshot doesn't support an inference, set \`text\` to "Not detectable from public signals" and \`conf\` to "low".
- Unit econ: if \`skuCount\` in snapshot > 0, reference it. If \`aggregateRating\` present, use reviewCount in reviewVelocity estimate (and mark conf "high"). If absent, mark "low" and write "Not detectable from public signals".
- Revenue tier: base on combination of SKU count, review velocity, ad tech, and marketplace presence. Never quote a specific £/$ figure.

${JSON_RULES}`;

module.exports = { BUSINESS_MODEL_PROMPT };
