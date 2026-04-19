/**
 * Infer user_type from scraped signals.
 * Returns one of: 'manufacturer', 'service_provider', or null (let the agent decide).
 *
 * We only return a hint when the score is clearly on one side. Mixed/weak
 * signals return null so the agent stays unbiased.
 */
function detectUserType(scrape) {
  if (!scrape) return null;

  const mfr = [];      // manufacturer / physical product
  const saas = [];     // SaaS / service provider

  const body = (scrape.bodyText || '').toLowerCase();
  const tech = (scrape.techStack || []).map(t => (t.name || '').toLowerCase());
  const marketplaces = Object.keys(scrape.marketplaceLinks || {});
  const title = (scrape.title || '').toLowerCase() + ' ' + (scrape.metaDescription || '').toLowerCase();

  // ── Manufacturer signals ──────────────────────────────────────────────────
  if (marketplaces.length > 0) mfr.push(`marketplace:${marketplaces.join(',')}`);
  if (tech.some(t => /shopify|woocommerce|bigcommerce|squarespace commerce/.test(t))) mfr.push('ecom-platform');
  if (/add to cart|add-to-cart|buy now|in stock|out of stock|shipping|free shipping|wholesale/i.test(body)) mfr.push('commerce-lang');
  if (/handmade|handcrafted|small batch|artisan|collection|product line|our products|made in/i.test(body)) mfr.push('maker-lang');
  if (/£\d|\$\d+(\.\d{2})?|€\d/.test(body.slice(0, 2000))) mfr.push('retail-price');

  // ── SaaS / service signals ───────────────────────────────────────────────
  if (/\bfree trial\b|\bstart free\b|\bno credit card\b/i.test(body)) saas.push('free-trial');
  if (/\bapi\b|\b\/api\b|\bsdk\b|\bwebhooks?\b|\bintegrations?\b/i.test(body)) saas.push('api-lang');
  if (/\bdashboard\b|\bsign in\b|\blogin\b|\bsign up\b|\bget started\b/i.test(body)) saas.push('app-lang');
  if (/\bper month\b|\b\/mo\b|\bper seat\b|\bper user\b|\bsubscription\b|\bpricing plans?\b/i.test(body)) saas.push('subscription-lang');
  if (tech.some(t => /stripe|intercom|segment|mixpanel|amplitude|posthog/.test(t))) saas.push('saas-stack');
  if (/software|platform|saas|app|tool for|built for teams/i.test(title)) saas.push('title-framing');

  // ── Decide ───────────────────────────────────────────────────────────────
  const mfrScore  = mfr.length;
  const saasScore = saas.length;
  const diff = Math.abs(mfrScore - saasScore);

  // Require a clear gap (≥2) AND a minimum floor (≥2) to emit a hint.
  if (mfrScore >= 2 && diff >= 2 && mfrScore > saasScore) {
    return { userType: 'manufacturer', reasons: mfr };
  }
  if (saasScore >= 2 && diff >= 2 && saasScore > mfrScore) {
    return { userType: 'service_provider', reasons: saas };
  }
  return { userType: null, reasons: [...mfr, ...saas] };
}

module.exports = { detectUserType };
