/**
 * Shared context block + universal rules for every agent.
 *
 * Every scraped signal the agents see lives here. If a signal is not in
 * this snapshot it MUST NOT appear in any agent output.
 */

function techStackStr(scrape) {
  const t = scrape.techStack || [];
  if (!t.length) return '- None detected';
  return t.map(x => `- ${x.category}: ${x.name}`).join('\n');
}

function seoChecksStr(scrape) {
  return (scrape.seoChecks || []).map(c => `- ${c.label}: ${c.value} [${c.status}]`).join('\n');
}

function pageSpeedStr(ps) {
  if (!ps || !ps.available) return '- Not available (PageSpeed API did not return data)';
  const m = ps.mobile || {};
  const d = ps.desktop || {};
  const cwv = (ps.cwv || []).map(x => `  - ${x.k}: ${x.value} [${x.pass ? 'pass' : 'fail'}, threshold ${x.threshold}]`).join('\n');
  return `- Mobile — Performance ${m.performance}/100, SEO ${m.seo}/100, Accessibility ${m.accessibility}/100, Best Practices ${m.bestPractices}/100
- Desktop — Performance ${d.performance}/100, SEO ${d.seo}/100, Accessibility ${d.accessibility}/100, Best Practices ${d.bestPractices}/100
- Core Web Vitals (${ps.cwvStrategy}):
${cwv}`;
}

function blogVelocityStr(scrape) {
  const bv = scrape.blogVelocity;
  if (!bv) return '- No blog detected (checked /blog, /news, /articles, /journal, /insights)';
  return `- Path: ${bv.probedPath} · Posts counted: ${bv.postCount ?? '—'} · Last post: ${bv.lastPost ?? 'unknown'}${bv.daysSinceLastPost != null ? ` (${bv.daysSinceLastPost} days ago)` : ''}`;
}

function aggregateRatingStr(scrape) {
  const ar = scrape.aggregateRating;
  if (!ar) return '- No aggregateRating schema detected';
  return `- ratingValue: ${ar.ratingValue ?? '—'} / reviewCount: ${ar.reviewCount ?? '—'} (from JSON-LD)`;
}

function buildContextBlock(scrape, userType, pageSpeed) {
  return `# BUSINESS DATA SNAPSHOT

**URL:** ${scrape.url}
**Business Type Hint:** ${userType || 'Let AI infer'}

## Page Signals
- Title: ${scrape.title || '—'}
- Meta description: ${scrape.metaDescription || '—'}
- OG title: ${scrape.ogTitle || '—'}
- OG description: ${scrape.ogDescription || '—'}
- OG site name: ${scrape.ogSiteName || '—'}
- OG type: ${scrape.ogType || '—'}
- H1 tags: ${JSON.stringify(scrape.h1Tags || [])}
- Canonical: ${scrape.canonical || '—'}
- Language: ${scrape.language || '—'}

## Presence
- Social links: ${JSON.stringify(scrape.socialLinks || {})}
- Marketplace links: ${JSON.stringify(scrape.marketplaceLinks || {})}
- Image alt coverage: ${scrape.imageAltCoverage?.withAlt || 0} / ${scrape.imageAltCoverage?.total || 0}
- SKU count (distinct /product links on page): ${scrape.skuCount ?? 0}

## Structured Data
- Schema types present: ${JSON.stringify(scrape.schemaTypes || [])}
${aggregateRatingStr(scrape)}

## Blog / Content velocity
${blogVelocityStr(scrape)}

## Tech Stack
${techStackStr(scrape)}

## SEO Checks
${seoChecksStr(scrape)}

## PageSpeed (real data from Google PSI)
${pageSpeedStr(pageSpeed)}

## Body Text Extract (truncated)
${(scrape.bodyText || '').substring(0, 2500)}
`;
}

const UNIVERSAL_RULES = `You are an AI business analyst producing a grounded audit report. Follow these non-negotiable rules:

1. Never fabricate data. If a signal is not in the snapshot, write "Not detectable" — do not guess.
2. Reference actual signals from the snapshot in every statement. No generic advice.
3. Confidence labels everywhere: "high" (scraped directly), "medium" (inferred from signals), "low" (estimated).
4. No revenue-impact predictions ("£40k unclaimed", "2.4× lift") unless grounded in concrete scrape data.
5. No made-up numbers for competitors (DA, review counts, ad booleans) — the snapshot has only YOUR target, not competitors.`;

const JSON_RULES = `OUTPUT FORMAT — STRICT JSON:

- Your response MUST be a single valid JSON object. No markdown code fences. No preamble. No trailing prose.
- Start with { and end with }. Nothing else.
- Use double-quoted strings. Escape internal quotes with \\".
- Booleans unquoted. Nulls unquoted. Use null for genuinely missing values.
- Match the schema EXACTLY — no extra keys, no missing keys.`;

module.exports = { buildContextBlock, UNIVERSAL_RULES, JSON_RULES };
