/**
 * Website Scraper Service
 * Extracts business intelligence from a target URL using cheerio + axios.
 * No external API key needed.
 *
 * Grounded signals only — we do NOT hallucinate numbers. Every value here
 * is pulled directly from the DOM / meta / JSON-LD / link targets.
 */
const axios = require('axios');
const cheerio = require('cheerio');

const TIMEOUT = 15000;
const ROBOTS_TIMEOUT = 5000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BOT_NAME = 'AIBusinessAnalyst';

// ── robots.txt ───────────────────────────────────────────────────────────────
function isAllowedByRobots(robotsTxt, path) {
  if (!robotsTxt) return true;
  const lines = robotsTxt.split(/\r?\n/);
  const groups = { mine: [], star: [] };
  let currentUA = null;

  for (const raw of lines) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      const ua = value.toLowerCase();
      if (ua === '*') currentUA = 'star';
      else if (ua.includes('aibusiness') || ua.includes('ai-business') || ua === BOT_NAME.toLowerCase()) currentUA = 'mine';
      else currentUA = null;
    } else if (currentUA && (key === 'allow' || key === 'disallow')) {
      groups[currentUA].push({ directive: key, pattern: value });
    }
  }

  const rules = groups.mine.length ? groups.mine : groups.star;
  if (!rules.length) return true;

  let best = null;
  for (const rule of rules) {
    if (rule.pattern === '') continue;
    if (path.startsWith(rule.pattern)) {
      if (!best || rule.pattern.length > best.pattern.length) best = rule;
    }
  }
  if (!best) return true;
  return best.directive === 'allow';
}

async function checkRobots(targetUrl) {
  let origin, pathname;
  try {
    const u = new URL(targetUrl);
    origin = `${u.protocol}//${u.host}`;
    pathname = u.pathname + (u.search || '');
  } catch {
    return { allowed: true };
  }

  try {
    const resp = await axios.get(origin + '/robots.txt', {
      timeout: ROBOTS_TIMEOUT,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: s => s < 500,
    });
    if (resp.status >= 400) return { allowed: true };
    const allowed = isAllowedByRobots(String(resp.data || ''), pathname);
    return allowed
      ? { allowed: true }
      : { allowed: false, reason: `This site's robots.txt disallows scraping ${pathname}.` };
  } catch (err) {
    console.warn(`[SCRAPER] robots.txt check failed for ${origin}: ${err.message} — continuing.`);
    return { allowed: true };
  }
}

// ── JSON-LD helpers ──────────────────────────────────────────────────────────
function extractJsonLd($) {
  const blocks = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) blocks.push(...parsed['@graph']);
      else blocks.push(parsed);
    } catch {
      // Malformed JSON-LD is surprisingly common — skip silently.
    }
  });
  return blocks;
}

function detectSchemaTypes(blocks) {
  const types = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    const t = node['@type'];
    if (t) {
      if (Array.isArray(t)) t.forEach(x => types.add(String(x)));
      else types.add(String(t));
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === 'object') walk(v);
    }
  };
  blocks.forEach(walk);
  return [...types];
}

function findAggregateRating(blocks) {
  let result = null;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'AggregateRating' || node.aggregateRating) {
      const ar = node['@type'] === 'AggregateRating' ? node : node.aggregateRating;
      if (ar && (ar.ratingValue || ar.reviewCount || ar.ratingCount)) {
        result = {
          ratingValue: parseFloat(ar.ratingValue) || null,
          reviewCount: parseInt(ar.reviewCount || ar.ratingCount, 10) || null,
        };
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === 'object') walk(v);
    }
  };
  blocks.forEach(walk);
  return result;
}

// ── SKU count — count distinct /products/* links on page ─────────────────────
function countSkus($, url) {
  let origin;
  try { origin = new URL(url).origin; } catch { origin = ''; }

  const productHrefs = new Set();
  $('a[href]').each((_, el) => {
    let href = $(el).attr('href') || '';
    if (!href) return;
    // Normalise
    if (href.startsWith('/')) href = origin + href;
    if (/\/products?\/[a-z0-9-]+(?:$|\?|#)/i.test(href) || /\/product\/[a-z0-9-]+/i.test(href)) {
      productHrefs.add(href.split(/[?#]/)[0]);
    }
  });
  return productHrefs.size;
}

// ── Case studies / portfolio density — service-business signal ──────────────
function countCaseStudies($, url) {
  let origin;
  try { origin = new URL(url).origin; } catch { origin = ''; }

  const hrefs = new Set();
  const patterns = [
    /\/case-stud(?:y|ies)\/[a-z0-9-]+/i,
    /\/work\/[a-z0-9-]+/i,
    /\/projects?\/[a-z0-9-]+/i,
    /\/portfolio\/[a-z0-9-]+/i,
    /\/cases?\/[a-z0-9-]+/i,
    /\/clients?\/[a-z0-9-]+/i,
    /\/stor(?:y|ies)\/[a-z0-9-]+/i,   // e.g. customer-stories/acme
    /\/customer-stor(?:y|ies)\/[a-z0-9-]+/i,
  ];

  $('a[href]').each((_, el) => {
    let href = $(el).attr('href') || '';
    if (!href) return;
    if (href.startsWith('/')) href = origin + href;
    if (patterns.some(p => p.test(href))) {
      hrefs.add(href.split(/[?#]/)[0]);
    }
  });

  // Fallback heuristic — if no direct matches, count anchors whose *text*
  // looks like a case-study link ("read case study", "view project").
  if (hrefs.size === 0) {
    $('a[href]').each((_, el) => {
      const text = ($(el).text() || '').trim().toLowerCase();
      if (/^(read (the )?case|view project|case study|see project|view work|read more)/.test(text)) {
        hrefs.add(($(el).attr('href') || '').split(/[?#]/)[0]);
      }
    });
  }
  return hrefs.size;
}

// ── Service lines — heuristic extraction from nav / headings / body ────────
function extractServiceLines($) {
  const lines = new Set();
  const SERVICE_WORDS = /(development|design|consulting|strategy|marketing|engineering|software|mobile|web|app development|apps?|ux|ui|branding|seo|analytics|data science|ai\b|ml\b|machine learning|cloud|devops|security|training|workshop|research|flutter|react|node|python|wordpress|shopify|e-commerce|ecommerce|saas|integration|migration|audit)/i;
  const SKIP = /^(home|about|contact|blog|careers|jobs|press|privacy|terms|login|sign[\s-]?up|faq|news|work|projects|portfolio|case stud(y|ies)|clients|services|company|team|resources|learn)$/i;
  const QUESTION = /\?|^(is|are|can|how|what|why|should|does|do|will|which|when|where)\b/i;

  // 1) Nav, header, menu links.
  $('nav a, header a, [class*="menu"] a, [class*="nav"] a, [role="navigation"] a').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 2 && text.length < 50 && SERVICE_WORDS.test(text) && !SKIP.test(text) && !QUESTION.test(text)) {
      lines.add(text.replace(/\s+/g, ' '));
    }
  });

  // 2) H2/H3 headings anywhere — often used as "What we do" section cards.
  $('h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 2 && text.length < 60 && SERVICE_WORDS.test(text) && !SKIP.test(text) && !QUESTION.test(text)) {
      lines.add(text.replace(/\s+/g, ' '));
    }
  });

  // 3) Any anchor anywhere (dedupe catches overlaps with step 1).
  $('a[href]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 2 && text.length < 50 && SERVICE_WORDS.test(text) && !SKIP.test(text) && !QUESTION.test(text)) {
      lines.add(text.replace(/\s+/g, ' '));
    }
  });

  return [...lines].slice(0, 10);
}

// ── Directory / credibility badges — service-business backlink-equivalents ──
function detectDirectoryBadges($) {
  const html = $.html().toLowerCase();
  const directories = [];
  const candidates = [
    { name: 'Clutch',      pattern: /clutch\.co/i },
    { name: 'G2',          pattern: /g2\.com|g2crowd\.com/i },
    { name: 'DesignRush',  pattern: /designrush\.com/i },
    { name: 'Trustpilot',  pattern: /trustpilot\.com/i },
    { name: 'Capterra',    pattern: /capterra\.com/i },
    { name: 'GoodFirms',   pattern: /goodfirms\.co/i },
    { name: 'ProductHunt', pattern: /producthunt\.com/i },
    { name: 'Awwwards',    pattern: /awwwards\.com/i },
    { name: 'Crunchbase',  pattern: /crunchbase\.com/i },
    { name: 'Gartner',     pattern: /gartner\.com/i },
    { name: 'LinkedIn company', pattern: /linkedin\.com\/company\//i },
  ];
  for (const c of candidates) {
    if (c.pattern.test(html)) directories.push(c.name);
  }
  return directories;
}

// ── Blog velocity — probe /blog for pubDate + post count ─────────────────────
async function probeBlogVelocity(url) {
  let origin;
  try { origin = new URL(url).origin; } catch { return null; }

  const candidates = ['/blog', '/news', '/articles', '/journal', '/insights'];
  for (const path of candidates) {
    try {
      const resp = await axios.get(origin + path, {
        timeout: 8000,
        headers: { 'User-Agent': USER_AGENT },
        validateStatus: s => s < 500,
        maxRedirects: 3,
      });
      if (resp.status >= 400) continue;
      const $ = cheerio.load(resp.data);

      // Count article-like elements
      const postCount =
        $('article').length ||
        $('[class*="post-"]').length ||
        $('a[href*="/blog/"]').length ||
        $('a[href*="/news/"]').length;

      // Last-updated: look for time[datetime] tags and pubDate meta
      const dates = [];
      $('time[datetime]').each((_, el) => {
        const dt = $(el).attr('datetime');
        if (dt) dates.push(new Date(dt));
      });
      const metaPub = $('meta[property="article:published_time"]').attr('content');
      if (metaPub) dates.push(new Date(metaPub));

      const valid = dates.filter(d => !isNaN(d.getTime())).sort((a, b) => b - a);
      const lastPost = valid[0] || null;
      const daysSince = lastPost ? Math.round((Date.now() - lastPost.getTime()) / 86_400_000) : null;

      if (postCount > 0 || lastPost) {
        return { probedPath: path, postCount: postCount || null, lastPost: lastPost?.toISOString() || null, daysSinceLastPost: daysSince };
      }
    } catch {
      // Try next candidate silently.
    }
  }
  return null;
}

// ── Main scrape ──────────────────────────────────────────────────────────────
async function scrapeWebsite(url) {
  if (!url.startsWith('http')) url = 'https://' + url;

  const robots = await checkRobots(url);
  if (!robots.allowed) {
    console.log(`[SCRAPER] Blocked by robots.txt: ${url}`);
    throw new Error(robots.reason || 'Blocked by robots.txt');
  }

  console.log(`[SCRAPER] Fetching ${url}...`);

  let html;
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
    });
    html = response.data;
  } catch (err) {
    console.error(`[SCRAPER] Failed to fetch ${url}:`, err.message);
    throw new Error(`Could not reach ${url} — ${err.message}`);
  }

  const $ = cheerio.load(html);

  // ── Meta ──
  const title = $('title').text().trim() || '';
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || '';
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || '';
  const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim() || '';
  const ogType = $('meta[property="og:type"]').attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
  const language = $('html').attr('lang') || '';
  const viewport = $('meta[name="viewport"]').attr('content') || '';

  // ── H1 ──
  const h1Tags = [];
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1Tags.push(text);
  });

  // ── Social links ──
  const socialLinks = {};
  const socialPatterns = {
    instagram: /instagram\.com/i,
    twitter: /twitter\.com|x\.com/i,
    facebook: /facebook\.com/i,
    linkedin: /linkedin\.com/i,
    youtube: /youtube\.com/i,
    tiktok: /tiktok\.com/i,
    pinterest: /pinterest\.com/i,
  };
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(href) && !socialLinks[platform]) socialLinks[platform] = href;
    }
  });

  // ── Marketplace links ──
  const marketplaceLinks = {};
  const marketplacePatterns = {
    etsy: /etsy\.com/i,
    amazon: /amazon\./i,
    shopify: /\.myshopify\.com/i,
    ebay: /ebay\./i,
    faire: /faire\.com/i,
    notonthehighstreet: /notonthehighstreet\.com/i,
  };
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const [platform, pattern] of Object.entries(marketplacePatterns)) {
      if (pattern.test(href) && !marketplaceLinks[platform]) marketplaceLinks[platform] = href;
    }
  });

  // ── Image alt coverage ──
  const totalImages = $('img').length;
  const imagesWithAlt = $('img[alt]').filter((_, el) => ($(el).attr('alt') || '').trim().length > 0).length;

  // ── Tech stack ──
  const techStack = [];
  const scriptSrcs = [];
  $('script[src]').each((_, el) => scriptSrcs.push($(el).attr('src') || ''));
  const allHtml = html.toLowerCase();

  const tech = (category, name, test) => { if (test) techStack.push({ category, name }); };
  tech('Analytics', 'Google Analytics (GA4)', scriptSrcs.some(s => s.includes('gtag') || s.includes('googletagmanager')) || allHtml.includes('google-analytics') || allHtml.includes('gtag('));
  tech('Tag managers', 'Google Tag Manager', scriptSrcs.some(s => s.includes('googletagmanager.com/gtm')));
  tech('Analytics', 'Plausible', scriptSrcs.some(s => s.includes('plausible')));
  tech('Analytics', 'Fathom', scriptSrcs.some(s => s.includes('usefathom')));
  tech('Heatmaps', 'Hotjar', scriptSrcs.some(s => s.includes('hotjar')));
  tech('Heatmaps', 'Microsoft Clarity', scriptSrcs.some(s => s.includes('clarity.ms')));
  tech('E-commerce', 'Shopify', allHtml.includes('shopify') || scriptSrcs.some(s => s.includes('shopify')));
  tech('E-commerce', 'WooCommerce', allHtml.includes('woocommerce'));
  tech('CMS', 'Squarespace', allHtml.includes('squarespace') || scriptSrcs.some(s => s.includes('squarespace')));
  tech('CMS', 'Wix', allHtml.includes('wix.com') || scriptSrcs.some(s => s.includes('wix')));
  tech('CMS', 'WordPress', allHtml.includes('wp-content') || allHtml.includes('wp-includes'));
  tech('CMS', 'Webflow', allHtml.includes('webflow.com') || allHtml.includes('data-wf-'));
  tech('CMS', 'Ghost', allHtml.includes('ghost.io') || allHtml.includes('ghost-sdk'));
  tech('CDN', 'Cloudflare', scriptSrcs.some(s => s.includes('cloudflare')) || allHtml.includes('__cf_bm'));
  tech('CDN', 'jsDelivr', scriptSrcs.some(s => s.includes('jsdelivr')));
  tech('Email', 'Klaviyo', allHtml.includes('klaviyo'));
  tech('Email', 'Mailchimp', allHtml.includes('mailchimp') || scriptSrcs.some(s => s.includes('mailchimp')));
  tech('Email', 'ConvertKit', allHtml.includes('convertkit'));
  tech('Reviews', 'Judge.me', allHtml.includes('judge.me') || allHtml.includes('judgeme'));
  tech('Reviews', 'Yotpo', allHtml.includes('yotpo'));
  tech('Reviews', 'Trustpilot', allHtml.includes('trustpilot'));
  tech('Payments', 'Stripe', allHtml.includes('js.stripe.com'));
  tech('Payments', 'PayPal', allHtml.includes('paypal.com'));
  tech('Scheduling', 'Calendly', allHtml.includes('calendly'));
  tech('Live chat', 'Intercom', allHtml.includes('intercom') || scriptSrcs.some(s => s.includes('intercom')));
  tech('Live chat', 'Drift', scriptSrcs.some(s => s.includes('drift')));
  tech('Live chat', 'Tawk.to', allHtml.includes('tawk.to'));
  tech('Ad tracking', 'Meta Pixel', allHtml.includes('connect.facebook.net') || allHtml.includes('fbq('));
  tech('Fonts', 'Google Fonts', allHtml.includes('fonts.googleapis.com') || allHtml.includes('fonts.gstatic.com'));
  if (ogTitle || ogDescription || ogImage) techStack.push({ category: 'SEO', name: 'Open Graph' });

  // ── SEO checks ──
  const seoChecks = [];
  const titleLen = title.length;
  seoChecks.push({ label: 'Meta Title', value: titleLen > 0 ? `${titleLen} chars` : 'Missing', status: titleLen === 0 ? 'fail' : titleLen > 60 ? 'warn' : 'ok' });
  const descLen = metaDescription.length;
  seoChecks.push({ label: 'Meta Description', value: descLen > 0 ? `${descLen} chars` : 'Missing', status: descLen === 0 ? 'fail' : descLen > 160 ? 'warn' : 'ok' });
  seoChecks.push({ label: 'Canonical URL', value: canonical ? 'Set' : 'Missing', status: canonical ? 'ok' : 'warn' });
  seoChecks.push({ label: 'Language', value: language || 'Not set', status: language ? 'ok' : 'warn' });
  seoChecks.push({ label: 'Mobile Friendly', value: viewport ? 'Yes' : 'No viewport tag', status: viewport ? 'ok' : 'fail' });
  seoChecks.push({ label: 'Image Alt Tags', value: `${imagesWithAlt}/${totalImages}`, status: totalImages === 0 ? 'ok' : imagesWithAlt / totalImages > 0.8 ? 'ok' : imagesWithAlt / totalImages > 0.4 ? 'warn' : 'fail' });
  seoChecks.push({ label: 'H1 Tag', value: h1Tags.length === 1 ? h1Tags[0].substring(0, 50) : h1Tags.length === 0 ? 'Missing' : `${h1Tags.length} found`, status: h1Tags.length === 1 ? 'ok' : h1Tags.length === 0 ? 'fail' : 'warn' });
  const isHttps = url.startsWith('https://');
  seoChecks.push({ label: 'HTTPS', value: isHttps ? 'Enabled' : 'Not detected', status: isHttps ? 'ok' : 'fail' });
  seoChecks.push({ label: 'Open Graph', value: ogTitle ? 'Present' : 'Missing', status: ogTitle ? 'ok' : 'warn' });

  // ── JSON-LD structured data ──
  const jsonLdBlocks = extractJsonLd($);
  const schemaTypes = detectSchemaTypes(jsonLdBlocks);
  const aggregateRating = findAggregateRating(jsonLdBlocks);
  seoChecks.push({
    label: 'Structured Data (JSON-LD)',
    value: schemaTypes.length ? schemaTypes.slice(0, 4).join(', ') + (schemaTypes.length > 4 ? '…' : '') : 'None detected',
    status: schemaTypes.length ? 'ok' : 'warn',
  });

  // ── SKU count (product links) ──
  const skuCount = countSkus($, url);

  // ── Service-business signals ──
  const caseStudyCount = countCaseStudies($, url);
  const serviceLines = extractServiceLines($);
  const directoryBadges = detectDirectoryBadges($);

  // ── Blog velocity (async probe) ──
  const blogVelocity = await probeBlogVelocity(url);

  // ── Body text for LLM context ──
  $('script, style, nav, footer, header, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);

  return {
    url,
    title,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage,
    ogSiteName,
    ogType,
    canonical,
    language,
    h1Tags,
    socialLinks,
    marketplaceLinks,
    imageAltCoverage: { total: totalImages, withAlt: imagesWithAlt },
    techStack,
    seoChecks,
    bodyText,
    schemaTypes,
    aggregateRating,
    skuCount,
    caseStudyCount,
    serviceLines,
    directoryBadges,
    blogVelocity,
  };
}

module.exports = { scrapeWebsite, checkRobots };
