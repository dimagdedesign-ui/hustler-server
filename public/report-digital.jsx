/* Digital presence (score tiles + CWV + E-E-A-T + GEO + keywords + tech stack),
 * Brand, Strategy, SWOT, Strategy docs, Methodology, Closing CTA.
 * Uses design's .score-tile / .cwv-table / .eeat-row / .card patterns. */

function scoreTile(lbl, score, icon) {
  if (score == null) {
    return (
      <div className="score-tile disabled">
        <div className="lbl"><span><i className={icon} style={{ marginRight: 6 }}></i>{lbl}</span></div>
        <div className="val">—<span className="denom"> /100</span></div>
        <div className="score-bar"><div className="fill" style={{ width: 0 }} /></div>
        <div className="caption"><span className="badge badge-muted" style={{ padding: '1px 8px' }}>Not measured</span></div>
      </div>
    );
  }
  const kind = score < 40 ? 'weak' : score < 60 ? 'needs' : score < 80 ? 'ok' : 'good';
  const label = score < 40 ? 'Weak' : score < 60 ? 'Needs work' : score < 80 ? 'Solid' : 'Strong';
  const capCls = score < 40 ? 'badge-danger' : score < 60 ? 'badge-warn' : score < 80 ? 'badge-info' : 'badge-success';
  return (
    <div className={`score-tile ${kind}`}>
      <div className="lbl"><span><i className={icon} style={{ marginRight: 6 }}></i>{lbl}</span></div>
      <div className="val">{score}<span className="denom"> /100</span></div>
      <div className="score-bar"><div className="fill" style={{ width: score + '%' }} /></div>
      <div className="caption"><span className={`badge ${capCls}`} style={{ padding: '1px 8px' }}>{label}</span></div>
    </div>
  );
}

function DigitalSection() {
  const r = window.REPORT;
  if (!r) return null;
  const d = r.digital || {};
  const top = d.topScores || {};
  const ps = d.pageSpeed;
  const eeat = d.eeat || [];
  const geo = d.geo || [];
  const keywords = d.keywordSeeds || { tofu: [], mofu: [], bofu: [], note: '' };
  const tech = (r.scrape?.techStack || []).slice(0, 16);

  const cwvFailing = ps?.cwv ? ps.cwv.filter(x => !x.pass).length : null;

  return (
    <section id="digital" className="report-section">
      <SectionEyebrow
        num="04"
        title="Digital presence audit"
        sub="SEO, GEO (Generative Engine Optimisation) readiness, performance, and E-E-A-T signals. CWV pass/fail is applied strictly per Google thresholds."
        icon="ri-pulse-line"
      />

      <div className="grid-4 mb-4">
        {scoreTile('SEO',           top.seo?.score,  'ri-search-eye-line')}
        {scoreTile('GEO readiness', top.geo?.score,  'ri-sparkling-2-line')}
        {scoreTile('Performance',   top.perf?.score, 'ri-speed-up-line')}
        {scoreTile('Tech stack',    top.tech?.score, 'ri-stack-line')}
      </div>

      {/* Core Web Vitals */}
      {ps && Array.isArray(ps.cwv) ? (
        <div className="card mt-6">
          <div className="card-hd">
            <div>
              <div className="eyebrow"><i className="ri-dashboard-line"></i>Core Web Vitals · {ps.cwvStrategy}</div>
              <h3>Performance benchmarks</h3>
              <div className="sub">Measured live via Google PageSpeed Insights. Failing metrics suppress both SEO ranking and paid conversion.</div>
            </div>
            <div className={`badge ${cwvFailing > 2 ? 'badge-danger' : cwvFailing > 0 ? 'badge-warn' : 'badge-success'}`}>
              <span className="dot"></span>{cwvFailing || 0} of {ps.cwv.length} failing
            </div>
          </div>
          <div className="cwv-table">
            <div className="cell head">Status</div>
            <div className="cell head">Metric</div>
            <div className="cell head">Current</div>
            <div className="cell head">Target</div>
            <div className="cell head">Note</div>
            {ps.cwv.map((c, i) => {
              const last = i === ps.cwv.length - 1;
              return (
                <React.Fragment key={c.k}>
                  <div className={`cell status ${c.pass ? 'pass' : 'fail'} ${last ? 'row-end' : ''}`}>
                    <i className={c.pass ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'}></i>
                  </div>
                  <div className={`cell ${last ? 'row-end' : ''}`} style={{ fontWeight: 600 }}>{c.k}</div>
                  <div className={`cell value ${last ? 'row-end' : ''}`} style={{ color: c.pass ? 'var(--success)' : 'var(--danger)' }}>
                    {c.value}
                  </div>
                  <div className={`cell ${last ? 'row-end' : ''}`} style={{ color: 'var(--fg-subtle)' }}>{c.threshold}</div>
                  <div className={`cell note ${last ? 'row-end' : ''}`}>
                    {ps.mobile && i === 0 ? `Mobile perf ${ps.mobile.performance}/100` : ''}
                    {ps.desktop && i === 1 ? `Desktop perf ${ps.desktop.performance}/100` : ''}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card card-pad mt-6">
          <div className="card-hd">
            <div>
              <div className="eyebrow"><i className="ri-dashboard-line"></i>Core Web Vitals</div>
              <h3>Not measured</h3>
              <div className="sub">Google PageSpeed Insights didn't return data for this URL. Try again later, or check if the site blocks automated scanners.</div>
            </div>
          </div>
        </div>
      )}

      {/* E-E-A-T + GEO split */}
      <div className="grid-2 mt-4">
        <div className="card card-pad">
          <div className="eyebrow"><i className="ri-user-star-line"></i>E-E-A-T signals</div>
          <h3 style={{ font: '300 20px/28px var(--font-sans)', margin: '6px 0 12px', letterSpacing: '-0.005em' }}>Content quality framework</h3>
          {eeat.map((e) => (
            <React.Fragment key={e.k}>
              <div className="eeat-row">
                <div className="k">{e.k}</div>
                <div className="bar"><div className="fill" style={{ width: (e.score / e.max) * 100 + '%' }} /></div>
                <div className="v">{e.score}<span style={{ color: 'var(--fg-subtle)', fontWeight: 400 }}>/{e.max}</span></div>
              </div>
              <div className="note" style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--fg-subtle)', paddingLeft: 0, marginTop: -8, marginBottom: 8, letterSpacing: 0.01 }}>
                {e.note}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="card card-pad">
          <div className="eyebrow"><i className="ri-robot-2-line"></i>GEO · AI search readiness</div>
          <h3 style={{ font: '300 20px/28px var(--font-sans)', margin: '6px 0 12px', letterSpacing: '-0.005em' }}>
            Detection score · {top.geo?.score ?? '—'} / 100
          </h3>
          <p style={{ font: '400 13px/20px var(--font-sans)', color: 'var(--fg-muted)', margin: '0 0 16px' }}>
            GEO measures how ready your site is to be cited by AI engines (ChatGPT, Perplexity, Google AI Overviews).
          </p>
          {geo.map((g) => (
            <div key={g.k} className="eeat-row">
              <div className="k">{g.k}</div>
              <div className="bar"><div className="fill" style={{ width: (g.value / g.max) * 100 + '%' }} /></div>
              <div className="v">{g.value}<span style={{ color: 'var(--fg-subtle)', fontWeight: 400 }}>/{g.max}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword seed clusters */}
      <div className="card mt-4">
        <div className="card-hd">
          <div>
            <div className="eyebrow"><i className="ri-hashtag"></i>Keyword seeds · funnel-aligned</div>
            <h3>Content opportunity map</h3>
            <div className="sub">{keywords.note || 'Suggested target keywords — not current rankings.'}</div>
          </div>
        </div>
        <div className="kw-grid" style={{ padding: 20 }}>
          {[
            { k: 'tofu', title: 'Top of funnel', note: 'Awareness · high volume · low intent', items: keywords.tofu || [] },
            { k: 'mofu', title: 'Middle of funnel', note: 'Comparison · mid intent', items: keywords.mofu || [] },
            { k: 'bofu', title: 'Bottom of funnel', note: 'Buy intent · convert 4–6× higher', items: keywords.bofu || [] },
          ].map((c, i) => (
            <div key={i} className="kw-card">
              <div className="kw-lbl">{c.title}</div>
              <div className="kw-note">{c.note}</div>
              <ul>{c.items.map((k, j) => <li key={j}>{k}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      {tech.length ? (
        <div className="card card-pad mt-4">
          <div className="eyebrow"><i className="ri-stack-line"></i>Detected tech stack</div>
          <h3 style={{ font: '300 20px/28px var(--font-sans)', margin: '6px 0 8px', letterSpacing: '-0.005em' }}>
            {tech.length} {tech.length === 1 ? 'tool' : 'tools'} identified on the live page
          </h3>
          <div className="tech-chips">
            {tech.map((t, i) => (
              <span key={i} className="chip"><i className="ri-checkbox-circle-line"></i> {t.name} <em>· {t.category}</em></span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BrandSection() {
  const r = window.REPORT;
  if (!r) return null;
  const b = r.digital?.brand;
  if (!b) return null;
  const ar = r.scrape?.aggregateRating;

  return (
    <section id="brand" className="report-section">
      <SectionEyebrow
        num="05"
        title="Brand assessment"
        sub="Consistency, colour alignment, tone, CTA patterns, plus a voice snapshot inferred from your body copy."
        icon="ri-palette-line"
      />

      <div className="brand-stats-row">
        <div className="brand-score-card">
          <div className="brand-k">Consistency</div>
          <div className="brand-v">{b.consistency ?? '—'}<span>/10</span></div>
        </div>
        <div className="brand-meta">
          <div className="row"><span>Colour alignment</span><strong>{b.colourAlignment || '—'}</strong></div>
          <div className="row"><span>Tone consistency</span><strong>{b.toneConsistency || '—'}</strong></div>
          <div className="row"><span>CTA consistency</span><strong>{b.ctaConsistency || '—'}</strong></div>
          <div className="row"><span>Visual coherence</span><strong>{b.visualCoherence || '—'}</strong></div>
          {ar ? (
            <div className="row">
              <span>Ratings (from schema)</span>
              <strong>{ar.ratingValue ?? '—'} · {ar.reviewCount ?? '—'} reviews</strong>
            </div>
          ) : null}
        </div>
      </div>

      <div className="brand-presence">
        <div><strong>Social:</strong> {b.socialPresenceNote || '—'}</div>
        <div><strong>Marketplace:</strong> {b.marketplacePresenceNote || '—'}</div>
      </div>

      <div className="card card-pad">
        <div className="eyebrow"><i className="ri-megaphone-line"></i>Brand voice snapshot</div>
        <h3 style={{ font: '300 20px/28px var(--font-sans)', margin: '6px 0 4px', letterSpacing: '-0.005em' }}>Tone</h3>
        <div style={{ font: '400 14px/1.5 var(--font-sans)', color: 'var(--fg-muted)' }}>{b.voice?.tone || '—'}</div>
        <div className="voice-cols">
          <div>
            <div className="lbl ok"><i className="ri-checkbox-circle-line"></i> Do</div>
            <ul>{(b.voice?.do || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div>
            <div className="lbl no"><i className="ri-close-circle-line"></i> Don't</div>
            <ul>{(b.voice?.dont || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function StrategySection() {
  const r = window.REPORT;
  if (!r) return null;
  const s = r.strategy || { phases: [], kpis: [] };
  return (
    <section id="strategy" className="report-section">
      <SectionEyebrow
        num="06"
        title="90-day plan"
        sub="Three phases with concrete moves tied to the snapshot signals, plus four KPIs to track."
        icon="ri-calendar-schedule-line"
      />
      <div className="phases">
        {(s.phases || []).map((p, i) => (
          <div key={i} className="phase-card">
            <div className="phase-name">{p.name}</div>
            <ul>{(p.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
      </div>
      {s.kpis?.length ? (
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div className="card-hd"><h3 style={{ margin: 0 }}>KPI targets</h3></div>
          <table className="tbl" style={{ marginTop: 12 }}>
            <thead><tr><th>KPI</th><th>Target</th></tr></thead>
            <tbody>{s.kpis.map((k, i) => <tr key={i}><td><strong>{k.name}</strong></td><td>{k.target}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function SwotSection() {
  const r = window.REPORT;
  if (!r) return null;
  const s = r.swot || {};
  const Q = ({ label, items, kind }) => (
    <div className={`swot-q k-${kind}`}>
      <div className="swot-q-hd">{label}</div>
      <ul>{(items || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
  return (
    <section id="swot" className="report-section">
      <SectionEyebrow
        num="07"
        title="SWOT"
        sub="Derived from all prior findings — strengths and opportunities ride on real snapshot signals; threats are calibrated against competitor positioning."
        icon="ri-focus-3-line"
      />
      <div className="swot-grid">
        <Q label="Strengths" items={s.strengths} kind="s" />
        <Q label="Weaknesses" items={s.weaknesses} kind="w" />
        <Q label="Opportunities" items={s.opportunities} kind="o" />
        <Q label="Threats" items={s.threats} kind="t" />
      </div>
    </section>
  );
}

function DocsSection() {
  const r = window.REPORT;
  if (!r) return null;
  const docs = r.docs || {};
  const [open, setOpen] = React.useState(null);

  const list = [
    { key: 'visionMission',   label: 'Vision & Mission',        icon: 'ri-compass-3-line' },
    { key: 'icp',             label: 'Ideal Customer Profile',  icon: 'ri-user-3-line' },
    { key: 'monetisation',    label: 'Monetisation Strategy',   icon: 'ri-exchange-dollar-line' },
    { key: 'sales',           label: 'Sales Strategies',        icon: 'ri-chat-quote-line' },
    { key: 'brandVoiceGuide', label: 'Brand Voice Guide',       icon: 'ri-palette-line' },
  ];

  const renderMd = (md) => {
    if (!md) return <em>Not generated.</em>;
    const lines = md.split('\n');
    const out = [];
    let buf = [];
    const flushList = () => { if (buf.length) { out.push(<ul key={out.length}>{buf.map((x, i) => <li key={i}>{x}</li>)}</ul>); buf = []; } };
    lines.forEach((raw, i) => {
      const line = raw.trimEnd();
      if (/^### /.test(line)) { flushList(); out.push(<h4 key={i}>{line.replace(/^### /, '')}</h4>); }
      else if (/^## /.test(line)) { flushList(); out.push(<h3 key={i}>{line.replace(/^## /, '')}</h3>); }
      else if (/^# /.test(line)) { flushList(); out.push(<h2 key={i}>{line.replace(/^# /, '')}</h2>); }
      else if (/^[-*] /.test(line)) { buf.push(line.replace(/^[-*] /, '')); }
      else if (line.trim() === '') { flushList(); }
      else { flushList(); out.push(<p key={i}>{line}</p>); }
    });
    flushList();
    return out;
  };

  return (
    <section id="docs" className="report-section">
      <SectionEyebrow
        num="08"
        title="Strategy documents"
        sub="Five short docs drafted from your snapshot — vision, ICP, monetisation, sales, voice."
        icon="ri-folder-3-line"
      />
      <div className="docs-list">
        {list.map((d, i) => {
          const isOpen = open === d.key;
          return (
            <div key={i} className={`doc-row ${isOpen ? 'open' : ''}`}>
              <button className="doc-hd" onClick={() => setOpen(isOpen ? null : d.key)}>
                <i className={d.icon}></i>
                <span className="lbl">{d.label}</span>
                <i className={isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
              </button>
              {isOpen ? <div className="doc-bd">{renderMd(docs[d.key])}</div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MethodSection() {
  const r = window.REPORT;
  if (!r) return null;
  const rows = r.methodology || [];
  const confEmoji = (c) => c === 'high' ? '🟢' : c === 'medium' ? '🟡' : '🔴';
  const confLabel = (c) => c === 'high' ? 'High' : c === 'medium' ? 'Medium' : 'Low';
  return (
    <section id="methodology" className="report-section">
      <SectionEyebrow
        num="10"
        title="Methodology"
        sub="Where every section gets its data from — and the confidence level we can honestly attach to each."
        icon="ri-shield-check-line"
      />
      <div className="card card-pad">
        <table className="tbl">
          <thead><tr><th>Section</th><th>Data source</th><th>Confidence</th></tr></thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={i}>
                <td><strong>{m.section}</strong></td>
                <td>{m.source}</td>
                <td>{confEmoji(m.confidence)} {confLabel(m.confidence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16, font: '400 12px/1.5 var(--font-sans)', color: 'var(--fg-subtle)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <i className="ri-shield-check-line" style={{ fontSize: 14, marginTop: 1 }}></i>
          <span>Publicly observable signals only. No per-competitor numerics are scraped — competitors are AI-suggested qualitatively and should be verified.</span>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="report-section" style={{ borderTop: 0, paddingTop: 16 }}>
      <div className="cta-card">
        <h3>Ready to ship this plan?</h3>
        <p>Every item in your checklist is a concrete move. Start with Do First, batch the rest. Share this report with your team.</p>
      </div>
    </section>
  );
}

Object.assign(window, { DigitalSection, BrandSection, StrategySection, SwotSection, DocsSection, MethodSection, ClosingCTA });
