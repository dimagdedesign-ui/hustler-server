/**
 * Google PageSpeed Insights service.
 * Returns real Core Web Vitals + category scores (mobile + desktop).
 * Free without a key (25 req/day). With PAGESPEED_API_KEY quota is 25,000/day.
 *
 * Fails gracefully — if PSI errors out, we return nulls so the rest of the
 * audit can still render.
 */
const axios = require('axios');

const PSI_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

async function fetchPageSpeed(url, strategy = 'mobile') {
  if (!url.startsWith('http')) url = 'https://' + url;
  console.log(`[PAGESPEED] ${strategy} for ${url}…`);

  const qs = new URLSearchParams({
    url,
    strategy,
    ...(process.env.PAGESPEED_API_KEY ? { key: process.env.PAGESPEED_API_KEY } : {}),
  });
  ['performance', 'accessibility', 'best-practices', 'seo'].forEach(c => qs.append('category', c));

  try {
    const resp = await axios.get(`${PSI_URL}?${qs.toString()}`, { timeout: 60_000 });
    const cats = resp.data.lighthouseResult?.categories || {};
    const audits = resp.data.lighthouseResult?.audits || {};

    const scores = {
      performance: Math.round((cats.performance?.score || 0) * 100),
      accessibility: Math.round((cats.accessibility?.score || 0) * 100),
      bestPractices: Math.round((cats['best-practices']?.score || 0) * 100),
      seo: Math.round((cats.seo?.score || 0) * 100),
    };

    const lcpMs = audits['largest-contentful-paint']?.numericValue || 0;
    const fcpMs = audits['first-contentful-paint']?.numericValue || 0;
    const tbtMs = audits['total-blocking-time']?.numericValue || 0;
    const clsVal = audits['cumulative-layout-shift']?.numericValue || 0;
    const ttfbMs = audits['server-response-time']?.numericValue || 0;
    const inpMs = audits['interaction-to-next-paint']?.numericValue || audits['experimental-interaction-to-next-paint']?.numericValue || 0;

    const cwv = [
      { k: 'LCP',  value: audits['largest-contentful-paint']?.displayValue || '—', pass: lcpMs > 0 && lcpMs <= 2500,  threshold: '< 2.5s' },
      { k: 'FCP',  value: audits['first-contentful-paint']?.displayValue || '—',   pass: fcpMs > 0 && fcpMs <= 1800,  threshold: '< 1.8s' },
      { k: 'TBT',  value: audits['total-blocking-time']?.displayValue || '—',      pass: tbtMs >= 0 && tbtMs <= 200,  threshold: '< 200ms' },
      { k: 'CLS',  value: audits['cumulative-layout-shift']?.displayValue || '—',  pass: clsVal >= 0 && clsVal <= 0.1, threshold: '< 0.1' },
      { k: 'INP',  value: audits['interaction-to-next-paint']?.displayValue || audits['experimental-interaction-to-next-paint']?.displayValue || '—', pass: inpMs > 0 && inpMs <= 200, threshold: '< 200ms' },
      { k: 'TTFB', value: audits['server-response-time']?.displayValue || '—',     pass: ttfbMs > 0 && ttfbMs <= 1200, threshold: '< 1.2s' },
    ];

    console.log(`[PAGESPEED] ${strategy} — perf ${scores.performance}, LCP ${cwv[0].value}`);
    return { scores, cwv, available: true };
  } catch (err) {
    console.error(`[PAGESPEED] ${strategy} error:`, err.message);
    return { scores: null, cwv: null, available: false, error: err.message };
  }
}

async function fetchFullPageSpeed(url) {
  const [mobile, desktop] = await Promise.all([
    fetchPageSpeed(url, 'mobile'),
    fetchPageSpeed(url, 'desktop'),
  ]);

  return {
    available: mobile.available || desktop.available,
    mobile: mobile.scores,
    desktop: desktop.scores,
    cwv: mobile.cwv,
    cwvStrategy: 'mobile',
  };
}

module.exports = { fetchPageSpeed, fetchFullPageSpeed };
