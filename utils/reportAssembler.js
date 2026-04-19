/**
 * Report Assembler — takes all agent outputs + scrape + PageSpeed and composes
 * a single typed `Report` object. Also runs 4 focused sub-LLM calls for the
 * cross-cutting sections (executive, maturity, SWOT, strategy, docs).
 *
 * Output shape is frozen — the UI binds directly to it.
 */
const { buildContextBlock } = require('../prompts/systemBase');
const { EXECUTIVE_PROMPT, MATURITY_PROMPT, SWOT_PROMPT, STRATEGY_PROMPT, DOCS_PROMPT } = require('../prompts/assembler');
const { callJson } = require('./jsonCall');

// ── helpers ──────────────────────────────────────────────────────────────────
function slugify(s = 'business') {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60) || 'business';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function extractBusinessName(scrape) {
  if (scrape.ogSiteName) return scrape.ogSiteName;
  const title = (scrape.ogTitle || scrape.title || '').split('|')[0].split('—')[0].split('-')[0].trim();
  if (title) return title;
  if (scrape.h1Tags && scrape.h1Tags.length) return scrape.h1Tags[0];
  try { return new URL(scrape.url).hostname.replace(/^www\./, ''); } catch { return 'Business'; }
}

function scoreLabel(score, thresholds = { ok: 70, warn: 40 }) {
  if (score == null) return 'Not measured';
  if (score >= thresholds.ok) return 'Solid';
  if (score >= thresholds.warn) return 'Needs work';
  return 'Failing';
}

function computeSeoScore(scrape) {
  const checks = scrape.seoChecks || [];
  if (!checks.length) return null;
  const weight = { ok: 1, warn: 0.5, fail: 0 };
  const total = checks.reduce((s, c) => s + (weight[c.status] ?? 0), 0);
  return Math.round((total / checks.length) * 100);
}

function computeTechScore(scrape) {
  const tech = scrape.techStack || [];
  const categories = new Set(tech.map(t => t.category));
  const expected = ['Analytics', 'E-commerce', 'Email', 'SEO'];
  const present = expected.filter(c => categories.has(c)).length;
  // Also reward diversity.
  const score = Math.round(((present / expected.length) * 70) + Math.min(tech.length * 3, 30));
  return Math.min(100, score);
}

function sumGeo(digital) {
  if (!digital?.geo) return null;
  return digital.geo.reduce((s, r) => s + (Number(r.value) || 0), 0);
}

function overallConfidence(scrape, pageSpeed) {
  const signals =
    (scrape.h1Tags?.length ? 1 : 0) +
    ((scrape.imageAltCoverage?.total || 0) > 5 ? 1 : 0) +
    ((scrape.techStack?.length || 0) >= 3 ? 1 : 0) +
    (scrape.schemaTypes?.length ? 1 : 0) +
    (pageSpeed?.available ? 1 : 0);
  if (signals >= 4) return 'high';
  if (signals >= 2) return 'medium';
  return 'low';
}

// ── main ────────────────────────────────────────────────────────────────────
async function assembleReport({ scrape, userType, pageSpeed, businessModel, competitor, digital, checklist, processingMs }) {
  const businessName = extractBusinessName(scrape);
  const date = todayISO();
  const slug = slugify(businessName);
  const context = buildContextBlock(scrape, userType, pageSpeed);

  // Cross-cutting sections in parallel.
  const priorFindingsBlock = `
## Prior Agent Findings (reference these)

### Business Model
${JSON.stringify(businessModel).slice(0, 3000)}

### Competitors
${JSON.stringify(competitor).slice(0, 2500)}

### Digital Presence
${JSON.stringify(digital).slice(0, 3000)}
`;

  console.log('[ASSEMBLER] Running sub-prompts in parallel…');
  const [executive, maturity, swot, strategy, docs] = await Promise.all([
    callJson({ label: 'ASM:exec',     system: EXECUTIVE_PROMPT, user: context + priorFindingsBlock + '\n\nProduce the JSON.', max_tokens: 600 }),
    callJson({ label: 'ASM:maturity', system: MATURITY_PROMPT,  user: context + priorFindingsBlock + '\n\nProduce the JSON.', max_tokens: 500 }),
    callJson({ label: 'ASM:swot',     system: SWOT_PROMPT,      user: context + priorFindingsBlock + '\n\nProduce the JSON.', max_tokens: 700 }),
    callJson({ label: 'ASM:strategy', system: STRATEGY_PROMPT,  user: context + priorFindingsBlock + '\n\nProduce the JSON.', max_tokens: 900 }),
    callJson({ label: 'ASM:docs',     system: DOCS_PROMPT,      user: context + priorFindingsBlock + '\n\nProduce the JSON.', max_tokens: 3500 }),
  ]);

  // Top-level digital scores.
  const seoScore = computeSeoScore(scrape);
  const geoScore = sumGeo(digital);
  const perfScore = pageSpeed?.available && pageSpeed.mobile ? pageSpeed.mobile.performance : null;
  const techScore = computeTechScore(scrape);

  const topScores = {
    seo:  seoScore  != null ? { score: seoScore,  label: scoreLabel(seoScore) }  : null,
    geo:  geoScore  != null ? { score: geoScore,  label: scoreLabel(geoScore, { ok: 60, warn: 35 }) } : null,
    perf: perfScore != null ? { score: perfScore, label: scoreLabel(perfScore) } : null,
    tech: techScore != null ? { score: techScore, label: scoreLabel(techScore) } : null,
  };

  // Methodology — reflects what we actually measured this run.
  const methodology = [
    { section: 'Business Model',      source: 'LLM inferred from scraped page signals, tech stack, marketplace links', confidence: 'medium' },
    { section: 'Competitive Landscape', source: 'LLM-suggested based on niche inference — qualitative only; no per-competitor scraped data', confidence: 'medium' },
    { section: 'E-E-A-T / GEO',       source: 'Derived from on-page signals + detected JSON-LD schema types', confidence: 'medium' },
    { section: 'Brand Assessment',    source: 'Inferred from tone of body text, detected social/marketplace links, schema-based review data', confidence: 'medium' },
    { section: 'Performance / CWV',   source: pageSpeed?.available ? 'Google PageSpeed Insights API (live measurement)' : 'Not available — PageSpeed API did not respond', confidence: pageSpeed?.available ? 'high' : 'low' },
    { section: 'Action Checklist',    source: 'LLM synthesised from all prior agents', confidence: 'high' },
  ];

  return {
    meta: {
      businessName,
      url: scrape.url,
      userType: userType || 'unknown',
      date,
      slug,
      tagline: scrape.ogDescription || scrape.metaDescription || null,
      confidence: overallConfidence(scrape, pageSpeed),
      processingMs,
    },
    scrape: {
      title: scrape.title,
      metaDescription: scrape.metaDescription,
      techStack: scrape.techStack,
      socialLinks: scrape.socialLinks,
      marketplaceLinks: scrape.marketplaceLinks,
      schemaTypes: scrape.schemaTypes,
      skuCount: scrape.skuCount,
      blogVelocity: scrape.blogVelocity,
      aggregateRating: scrape.aggregateRating,
      seoChecks: scrape.seoChecks,
      imageAltCoverage: scrape.imageAltCoverage,
    },
    executive,
    maturity,
    businessModel,
    competitor,
    digital: {
      ...digital,
      topScores,
      pageSpeed: pageSpeed?.available ? pageSpeed : null,
    },
    swot,
    strategy,
    docs,
    checklist,
    methodology,
  };
}

module.exports = { assembleReport };
