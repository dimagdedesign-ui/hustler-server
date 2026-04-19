const { UNIVERSAL_RULES, JSON_RULES } = require('./systemBase');

const BUSINESS_MODEL_PROMPT = `${UNIVERSAL_RULES}

## Your Task — Classic Business Model Canvas (Osterwalder) + Unit Economics

Produce a classic 9-block Business Model Canvas and a Unit Economics estimate, strictly from the snapshot. Use the Osterwalder block names exactly as shown — they must match the UI's expected keys.

### Required JSON schema

{
  "canvas": [
    { "key": "Key Partnerships",         "conf": "high|medium|low", "text": "..." },
    { "key": "Key Activities",           "conf": "...", "text": "..." },
    { "key": "Key Resources",            "conf": "...", "text": "..." },
    { "key": "Value Proposition",        "conf": "...", "text": "..." },
    { "key": "Customer Relationships",   "conf": "...", "text": "..." },
    { "key": "Channels",                 "conf": "...", "text": "..." },
    { "key": "Customer Segments",        "conf": "...", "text": "..." },
    { "key": "Cost Structure",           "conf": "...", "text": "..." },
    { "key": "Revenue Streams",          "conf": "...", "text": "..." }
  ],
  "unitEcon": {
    "aov":            { "value": "£XX or $XX or 'Not detectable'",     "conf": "...", "note": "..." },
    "skus":           { "value": "integer or 'Not detectable'",        "conf": "...", "note": "..." },
    "priceRange":     { "value": "Low | Mid | Premium + example",      "conf": "...", "note": "..." },
    "revenueTier":    { "value": "Low (<£50k) | Mid (£50k–£300k) | High (£300k+)", "conf": "...", "note": "..." },
    "reviewVelocity": { "value": "~X/month or 'Not detectable'",       "conf": "...", "note": "..." }
  }
}

### Rules specific to this task
- All 9 canvas keys must be present in that exact order with those exact names.
- Each canvas \`text\` must be 1–2 sentences, specific to THIS business, referencing a scraped signal (tech stack, marketplace links, body text phrases, SKU count, schema types).
- If a signal is missing, set \`text\` to "Not detectable from public signals" and \`conf\` to "low".
- Unit econ \`skus\`: if the snapshot \`skuCount\` is > 0, use that exact integer with conf "high"; otherwise set "Not detectable" with conf "low".
- Unit econ \`reviewVelocity\`: if \`aggregateRating.reviewCount\` is present, derive a monthly estimate (assume listing age of ~24 months if unknown); otherwise "Not detectable".
- Revenue tier: base on combination of SKU count, review velocity, ad tech, marketplace presence. Never quote a specific £/$ figure.

${JSON_RULES}`;

module.exports = { BUSINESS_MODEL_PROMPT };
