const { UNIVERSAL_RULES, JSON_RULES } = require('./systemBase');

const COMPETITOR_PROMPT = `${UNIVERSAL_RULES}

## Your Task — Competitive Landscape (qualitative only)

Suggest exactly 5 plausible competitors based on the business's niche, products, and geography. Score each on a composite Threat Score (0–10) using your knowledge of the market. Do NOT invent per-competitor numerics (DA, content velocity, review counts, ad spend) — we don't have that data, and the report must not fabricate it.

### Required JSON schema

{
  "list": [
    {
      "name": "Brand name",
      "domain": "brand.com",
      "threat": 7.8,
      "threatTier": "high",      // "high" | "medium" | "low" — high ≥7, medium 4–6.9, low <4
      "positioning": "One sentence describing how they position themselves.",
      "weakness": "One specific observable weakness (e.g. 'no blog activity visible', 'no schema markup on landing pages'). Never invented numbers."
    }
    // ...5 total
  ],
  "disclaimer": "One sentence note that competitors are suggested by AI based on niche and should be verified by the user."
}

### Rules specific to this task
- Pick real, plausible competitors in the same geographic/price tier when detectable from the snapshot.
- Threat scores must vary — do not give everyone the same number.
- Positioning must sound like it was written from their actual public positioning.
- Weakness must be specific but NON-NUMERIC (no DA, no review counts, no "X posts/month").
- If the niche is too narrow to identify 5 real competitors, mark the later ones with "name": "Generic competitor N" and "conf": "low" in threat (still fill the rest).

${JSON_RULES}`;

module.exports = { COMPETITOR_PROMPT };
