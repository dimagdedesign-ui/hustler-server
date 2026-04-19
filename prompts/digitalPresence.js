const { UNIVERSAL_RULES, JSON_RULES } = require('./systemBase');

const DIGITAL_PRESENCE_PROMPT = `${UNIVERSAL_RULES}

## Your Task — Digital Presence Audit (E-E-A-T + GEO + Brand + Keyword Seeds)

Produce structured data for 4 sub-sections. PageSpeed data is already collected separately and is NOT your responsibility — do not score performance here.

### Required JSON schema

{
  "eeat": [
    { "k": "Experience",       "score": 0, "max": 3, "note": "What was / wasn't found — founder story, case studies, author bios." },
    { "k": "Expertise",        "score": 0, "max": 3, "note": "Blog depth, FAQ schema, how-to content." },
    { "k": "Authoritativeness","score": 0, "max": 3, "note": "Press mentions, backlinks, directory listings." },
    { "k": "Trustworthiness",  "score": 0, "max": 4, "note": "HTTPS, privacy, terms, reviews, contact page." }
  ],
  "geo": [
    { "k": "Structured data (schema.org)", "value": 0, "max": 25, "note": "What schema is present / missing based on snapshot schemaTypes." },
    { "k": "E-E-A-T signals",              "value": 0, "max": 25, "note": "Mirror E-E-A-T total scaled to 25." },
    { "k": "Content depth (1500+ word pages)", "value": 0, "max": 20, "note": "Inferred from body text / blog presence." },
    { "k": "Quotable statements",          "value": 0, "max": 15, "note": "Are hero statements quote-worthy for LLMs?" },
    { "k": "Author entity markup",         "value": 0, "max": 15, "note": "Person / author schema present in schemaTypes?" }
  ],
  "brand": {
    "consistency": 0,                  // 0-10
    "colourAlignment": "consistent | inconsistent | not detectable",
    "toneConsistency": "consistent | inconsistent | not detectable",
    "ctaConsistency": "consistent | inconsistent | not detectable",
    "visualCoherence": "lifestyle | product-only | mixed | not detectable",
    "socialPresenceNote": "One sentence summarising platforms + frequency if inferable.",
    "marketplacePresenceNote": "One sentence summarising marketplaces detected or 'None detected'.",
    "voice": {
      "tone": "3–4 adjectives describing the inferred brand tone",
      "do":   ["5 rules"],
      "dont": ["5 rules"]
    }
  },
  "keywordSeeds": {
    "tofu": ["educational top-funnel query 1", "query 2", "query 3"],
    "mofu": ["comparative mid-funnel query 1", "query 2", "query 3"],
    "bofu": ["buy-intent bottom-funnel query 1", "query 2", "query 3"],
    "note": "These are suggested target keywords — NOT current rankings. We do not have keyword rank data."
  }
}

### Rules specific to this task
- Every score must be justified in its \`note\` with a reference to the snapshot. If there's no signal for a dimension, score it 0 and write "Not detectable."
- Brand \`consistency\` — base it on: coherent tone across H1 + meta + body text, branded colours inferable from tech stack, whether CTAs are repeated consistently in body. If too little content, mark 0 and note "Not detectable."
- \`voice.do\` / \`voice.dont\` — infer from the actual body text style. Each rule must be actionable, not generic.
- \`keywordSeeds\` — suggest realistic seeds the business could target; never claim current rankings.

${JSON_RULES}`;

module.exports = { DIGITAL_PRESENCE_PROMPT };
