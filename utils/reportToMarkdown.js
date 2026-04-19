/**
 * Serialise a Report JSON object into a human-readable markdown file.
 * Used by POST /api/analyse/md for the download button.
 */
function confIcon(c) { return c === 'high' ? '🟢' : c === 'medium' ? '🟡' : '🔴'; }

function mdTable(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep  = `|${headers.map(() => '---').join('|')}|`;
  const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
}

function reportToMarkdown(r) {
  const m = r.meta;

  const canvasTable = mdTable(
    ['Block', 'Confidence', 'Detail'],
    (r.businessModel?.canvas || []).map(c => [c.key, confIcon(c.conf), c.text])
  );

  const unitEcon = r.businessModel?.unitEcon || {};
  const econTable = mdTable(
    ['Metric', 'Value', 'Confidence', 'Note'],
    [
      ['AOV',             unitEcon.aov?.value || '—',            confIcon(unitEcon.aov?.conf),            unitEcon.aov?.note || ''],
      ['Price Range',     unitEcon.priceRange?.value || '—',     confIcon(unitEcon.priceRange?.conf),     unitEcon.priceRange?.note || ''],
      ['Revenue Tier',    unitEcon.revenueTier?.value || '—',    confIcon(unitEcon.revenueTier?.conf),    unitEcon.revenueTier?.note || ''],
      ['Review Velocity', unitEcon.reviewVelocity?.value || '—', confIcon(unitEcon.reviewVelocity?.conf), unitEcon.reviewVelocity?.note || ''],
    ]
  );

  const competitorTable = mdTable(
    ['#', 'Domain', 'Threat', 'Tier', 'Positioning', 'Weakness'],
    (r.competitor?.list || []).map((c, i) => [i + 1, c.domain || c.name, `${c.threat}/10`, c.threatTier, c.positioning, c.weakness])
  );

  const eeatTable = mdTable(
    ['Dimension', 'Score', 'Max', 'Note'],
    (r.digital?.eeat || []).map(e => [e.k, e.score, e.max, e.note])
  );

  const geoTable = mdTable(
    ['Signal', 'Score', 'Max', 'Note'],
    (r.digital?.geo || []).map(g => [g.k, g.value, g.max, g.note])
  );

  const cwvTable = r.digital?.pageSpeed?.cwv
    ? mdTable(
        ['Metric', 'Value', 'Threshold', 'Status'],
        r.digital.pageSpeed.cwv.map(x => [x.k, x.value, x.threshold, x.pass ? '✅ pass' : '❌ fail'])
      )
    : '_PageSpeed not available for this run._';

  const scoresTable = mdTable(
    ['Score', 'Value', 'Label'],
    [
      ['SEO',  r.digital?.topScores?.seo?.score ?? '—',  r.digital?.topScores?.seo?.label ?? '—'],
      ['GEO',  r.digital?.topScores?.geo?.score ?? '—',  r.digital?.topScores?.geo?.label ?? '—'],
      ['Perf', r.digital?.topScores?.perf?.score ?? '—', r.digital?.topScores?.perf?.label ?? '—'],
      ['Tech', r.digital?.topScores?.tech?.score ?? '—', r.digital?.topScores?.tech?.label ?? '—'],
    ]
  );

  const swot = r.swot || {};
  const swotTable =
    `| **Strengths** | **Weaknesses** |
|:---|:---|
| ${(swot.strengths || []).map(b => `• ${b}`).join('<br>')} | ${(swot.weaknesses || []).map(b => `• ${b}`).join('<br>')} |
| **Opportunities** | **Threats** |
| ${(swot.opportunities || []).map(b => `• ${b}`).join('<br>')} | ${(swot.threats || []).map(b => `• ${b}`).join('<br>')} |`;

  const strategy = r.strategy || { phases: [], kpis: [] };
  const strategyMd = [
    ...(strategy.phases || []).map(p => `### ${p.name}\n${(p.bullets || []).map(b => `- ${b}`).join('\n')}`),
    strategy.kpis?.length ? `### KPI Targets\n${mdTable(['KPI', 'Target'], strategy.kpis.map(k => [k.name, k.target]))}` : '',
  ].join('\n\n');

  const checklistMd = (r.checklist || []).map((it, i) => `### ${i + 1}. ${it.title}  ·  ICE ${it.ice}

- **Category:** ${it.category}  ·  **Effort:** ${it.effort}  ·  **Quadrant:** ${it.quadrant}
- **Impact / Confidence / Ease:** ${it.impact} / ${it.confidence} / ${it.ease}
- **Why:** ${it.why}
- **Steps:**
${(it.steps || []).map(s => `  - [ ] ${s}`).join('\n')}
`).join('\n---\n\n');

  const methodologyTable = mdTable(
    ['Section', 'Data Source', 'Confidence'],
    (r.methodology || []).map(x => [x.section, x.source, confIcon(x.confidence)])
  );

  return `# Business Audit Report — ${m.businessName}

| Field | Value |
|---|---|
| **Date** | ${m.date} |
| **URL** | ${m.url} |
| **Business Type** | ${m.userType} |
| **Overall Confidence** | ${confIcon(m.confidence)} ${m.confidence} |
| **Processing Time** | ${(m.processingMs / 1000).toFixed(1)}s |

> This report is generated from publicly observable signals on the website plus live PageSpeed data. It is a starting point for judgement — verify specific claims before acting.

---

## 1. Executive Summary

${(r.executive?.bullets || []).map(b => {
  const tag = b.kind === 'win' ? '✅ Win' : b.kind === 'risk' ? '⚠️ Risk' : '🎯 Action';
  return `- **${tag}:** ${b.text}`;
}).join('\n')}

### Maturity at a Glance

${mdTable(
  ['Dimension', 'Stage', 'Level', 'Assessment'],
  (r.maturity?.rows || []).map(x => [x.dimension, `${x.stage}/4`, x.level, x.assessment])
)}

---

## 2. Business Model (Lean Canvas)

${canvasTable}

### Unit Economics

${econTable}

---

## 3. Competitive Landscape

${competitorTable}

> ${r.competitor?.disclaimer || 'Competitors suggested by AI — verify against your own research.'}

---

## 4. Digital Presence

### Top-Level Scores

${scoresTable}

### Core Web Vitals (Google PageSpeed, mobile)

${cwvTable}

### E-E-A-T

${eeatTable}

### GEO Readiness

${geoTable}

### Keyword Seeds (suggestions — not current rankings)

- **TOFU:** ${(r.digital?.keywordSeeds?.tofu || []).join(' · ')}
- **MOFU:** ${(r.digital?.keywordSeeds?.mofu || []).join(' · ')}
- **BOFU:** ${(r.digital?.keywordSeeds?.bofu || []).join(' · ')}

---

## 5. Brand Assessment

| Metric | Value |
|---|---|
| Consistency | ${r.digital?.brand?.consistency ?? '—'} / 10 |
| Colour Alignment | ${r.digital?.brand?.colourAlignment ?? '—'} |
| Tone Consistency | ${r.digital?.brand?.toneConsistency ?? '—'} |
| CTA Consistency | ${r.digital?.brand?.ctaConsistency ?? '—'} |
| Visual Coherence | ${r.digital?.brand?.visualCoherence ?? '—'} |
| Social Presence | ${r.digital?.brand?.socialPresenceNote ?? '—'} |
| Marketplace Presence | ${r.digital?.brand?.marketplacePresenceNote ?? '—'} |

### Brand Voice

**Tone:** ${r.digital?.brand?.voice?.tone || '—'}

**Do**
${(r.digital?.brand?.voice?.do || []).map(d => `- ${d}`).join('\n')}

**Don't**
${(r.digital?.brand?.voice?.dont || []).map(d => `- ${d}`).join('\n')}

---

## 6. SWOT

${swotTable}

---

## 7. 90-Day Plan

${strategyMd}

---

## 8. Strategy Documents

### Vision & Mission
${r.docs?.visionMission || ''}

---

### Ideal Customer Profile
${r.docs?.icp || ''}

---

### Monetisation Strategy
${r.docs?.monetisation || ''}

---

### Sales Strategies
${r.docs?.sales || ''}

---

### Brand Voice Guide
${r.docs?.brandVoiceGuide || ''}

---

## 9. Action Plan — 50 ICE-Scored Moves

${checklistMd}

---

## 10. Methodology

${methodologyTable}

_Note: the report was generated from publicly available signals + PageSpeed. Higher-confidence scoring requires internal revenue, customer, and analytics data._
`;
}

module.exports = { reportToMarkdown };
