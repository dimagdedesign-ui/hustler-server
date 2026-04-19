/**
 * POST /api/analyse        → returns the typed Report JSON
 * POST /api/analyse/md     → same pipeline, returns markdown attachment
 *
 * Pipeline:
 *   1. Validate URL
 *   2. Scrape + PageSpeed in parallel
 *   3. Business Model + Competitor + Digital Presence agents in parallel
 *   4. Checklist agent (needs outputs from step 3)
 *   5. Assembler (executive, maturity, SWOT, strategy, docs in parallel)
 */
const express = require('express');
const rateLimit = require('express-rate-limit');

const { scrapeWebsite } = require('../services/scraper');
const { fetchFullPageSpeed } = require('../services/pagespeed');
const { runBusinessModelAgent } = require('../agents/businessModel');
const { runCompetitorAgent } = require('../agents/competitor');
const { runDigitalPresenceAgent } = require('../agents/digitalPresence');
const { runChecklistAgent } = require('../agents/checklist');
const { assembleReport } = require('../utils/reportAssembler');
const { reportToMarkdown } = require('../utils/reportToMarkdown');
const { detectUserType } = require('../utils/detectUserType');

const router = express.Router();

// ── Rate limit: 3 per IP per hour ────────────────────────────────────────────
const analyseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. You can run 3 analyses per hour. Try again later.' },
});

// ── URL validation ───────────────────────────────────────────────────────────
const SENSITIVE_QUERY_KEYS = [
  'token', 'auth', 'auth_token', 'access_token', 'id_token', 'refresh_token',
  'api_key', 'apikey', 'key', 'secret', 'password', 'passwd', 'pwd',
  'session', 'sessionid', 'session_id', 'sid',
  'signature', 'sig', 'nonce', 'hash', 'bearer',
];

function validateUrl(raw) {
  if (!raw || typeof raw !== 'string') return { ok: false, error: 'URL is required.' };
  let normalised = raw.trim();
  if (!normalised.startsWith('http')) normalised = 'https://' + normalised;

  let parsed;
  try { parsed = new URL(normalised); }
  catch { return { ok: false, error: 'Invalid URL format.' }; }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only http and https URLs are supported.' };
  }

  const hostname = parsed.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname) ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname) ||
    !hostname.includes('.')
  ) {
    return { ok: false, error: 'Please provide a real public domain.' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Please remove credentials from the URL before submitting.' };
  }

  const sensitiveHit = [...parsed.searchParams.keys()].find(k =>
    SENSITIVE_QUERY_KEYS.includes(k.toLowerCase())
  );
  if (sensitiveHit) {
    return {
      ok: false,
      error: `Remove "${sensitiveHit}" from your URL before submitting — it looks like an authentication token.`,
    };
  }

  return { ok: true, url: normalised };
}

// ── Main pipeline (shared between JSON + markdown endpoints) ────────────────
async function runPipeline({ url, userType, ip }) {
  const started = Date.now();
  console.log(`\n[ANALYSE] ▶ ${url} | user_type=${userType || 'auto'} | ip=${ip}`);

  // Scrape + PageSpeed in parallel. PageSpeed failing must not block the run.
  const [scrape, pageSpeed] = await Promise.all([
    scrapeWebsite(url),
    fetchFullPageSpeed(url).catch(err => {
      console.warn('[ANALYSE] PageSpeed failed non-blocking:', err.message);
      return { available: false, mobile: null, desktop: null, cwv: null };
    }),
  ]);

  // Auto-detect user type from scraped signals if none was passed.
  let effectiveUserType = userType;
  if (!effectiveUserType) {
    const detected = detectUserType(scrape);
    if (detected.userType) {
      effectiveUserType = detected.userType;
      console.log(`[ANALYSE] Auto-detected user_type=${effectiveUserType} (${detected.reasons.join(', ')})`);
    } else {
      console.log(`[ANALYSE] user_type ambiguous — letting agent infer`);
    }
  }

  // 3 agents in parallel.
  const agentInput = { scrape, userType: effectiveUserType, pageSpeed };
  const [businessModel, competitor, digital] = await Promise.all([
    runBusinessModelAgent(agentInput),
    runCompetitorAgent(agentInput),
    runDigitalPresenceAgent(agentInput),
  ]);

  // Checklist needs the three prior outputs.
  const checklist = await runChecklistAgent({ ...agentInput, businessModel, competitor, digital });

  // Final assemble.
  const report = await assembleReport({
    scrape, userType: effectiveUserType, pageSpeed,
    businessModel, competitor, digital, checklist,
    processingMs: Date.now() - started,
  });

  console.log(`[ANALYSE] ✓ ${report.meta.businessName} | ${((Date.now() - started) / 1000).toFixed(1)}s | checklist=${(checklist || []).length} items`);
  return report;
}

// ── JSON endpoint ────────────────────────────────────────────────────────────
router.post('/', analyseLimiter, async (req, res) => {
  const { url: rawUrl, user_type: userType } = req.body || {};
  const v = validateUrl(rawUrl);
  if (!v.ok) return res.status(400).json({ error: v.error });

  try {
    const report = await runPipeline({ url: v.url, userType, ip: req.ip });
    res.json({ ok: true, report });
  } catch (err) {
    console.error('[ANALYSE] ✗ Error:', err.message);
    console.error(err.stack);
    const m = err.message || 'Unknown error';
    // Check specific error patterns before generic status codes.
    const msg = /credit|balance|quota/i.test(m)
      ? 'Your Anthropic credit balance is too low. Top up at console.anthropic.com → Plans & Billing, then retry.'
      : /scrap|reach|robots|ENOTFOUND|ETIMEDOUT/i.test(m)
        ? `Could not scrape the provided URL — ${m}`
        : /401|authentication/i.test(m)
          ? 'Anthropic API key rejected (401). Check ANTHROPIC_API_KEY in Render env vars.'
          : /429|rate.?limit/i.test(m)
            ? 'Anthropic rate-limited. Wait a minute and retry.'
            : /529|overload/i.test(m)
              ? 'Anthropic is temporarily overloaded. Retry shortly.'
              : /JSON|parse|Unterminated|Truncated/i.test(m)
                ? `AI response did not parse — ${m}`
                : /400|invalid.?request/i.test(m)
                  ? `Anthropic rejected the request: ${m}`
                  : `Pipeline error: ${m}`;
    res.status(500).json({ error: msg, detail: m, stack: err.stack?.split('\n').slice(0, 4).join('\n') });
  }
});

// ── Markdown download endpoint ──────────────────────────────────────────────
router.post('/md', analyseLimiter, async (req, res) => {
  const { url: rawUrl, user_type: userType } = req.body || {};
  const v = validateUrl(rawUrl);
  if (!v.ok) return res.status(400).json({ error: v.error });

  try {
    const report = await runPipeline({ url: v.url, userType, ip: req.ip });
    const markdown = reportToMarkdown(report);
    const filename = `${report.meta.slug}-audit-${report.meta.date}.md`;
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (err) {
    console.error('[ANALYSE:md] ✗ Error:', err.message);
    res.status(500).json({ error: 'Something went wrong generating your markdown report.' });
  }
});

// ── Convert an existing report payload to markdown (no re-run) ──────────────
router.post('/export', async (req, res) => {
  const { report } = req.body || {};
  if (!report || !report.meta) return res.status(400).json({ error: 'Missing report payload' });
  const markdown = reportToMarkdown(report);
  const filename = `${report.meta.slug || 'report'}-audit-${report.meta.date || 'latest'}.md`;
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(markdown);
});

module.exports = router;
