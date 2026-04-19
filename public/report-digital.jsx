/* Digital presence — top scores + CWV (real PageSpeed) + E-E-A-T + GEO +
 * keyword seeds + brand assessment + voice snapshot. */
function DigitalSection() {
  const r = window.REPORT;
  if (!r) return null;
  const d = r.digital || {};
  const top = d.topScores || {};
  const ps = d.pageSpeed;
  const eeat = d.eeat || [];
  const geo = d.geo || [];
  const keywords = d.keywordSeeds || { tofu: [], mofu: [], bofu: [], note: '' };
  const tech = (r.scrape?.techStack || []).slice(0, 12);

  const ScoreCard = ({ k, data }) => {
    if (!data) return (
      <div className="score-card disabled">
        <div className="score-k">{k}</div>
        <div className="score-v">—</div>
        <div className="score-l">Not measured</div>
      </div>
    );
    const color = data.score >= 70 ? 'var(--semantic-success)' : data.score >= 40 ? 'var(--semantic-warning)' : 'var(--semantic-danger)';
    return (
      <div className="score-card">
        <div className="score-k">{k}</div>
        <div className="score-v" style={{ color }}>{data.score}</div>
        <div className="score-l">{data.label}</div>
      </div>
    );
  };

  return (
    <section id="digital" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">04</div>
        <h2>Digital presence</h2>
      </div>

      <div className="scores-row">
        <ScoreCard k="SEO"  data={top.seo} />
        <ScoreCard k="GEO"  data={top.geo} />
        <ScoreCard k="Perf" data={top.perf} />
        <ScoreCard k="Tech" data={top.tech} />
      </div>

      {ps && Array.isArray(ps.cwv) ? (
        <>
          <div className="rsec-subhead">Core Web Vitals — Google PageSpeed ({ps.cwvStrategy})</div>
          <table className="tbl">
            <thead><tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr></thead>
            <tbody>
              {ps.cwv.map((x, i) => (
                <tr key={i}>
                  <td><strong>{x.k}</strong></td>
                  <td>{x.value}</td>
                  <td>{x.threshold}</td>
                  <td>
                    <span className={`chip ${x.pass ? 'chip-success' : 'chip-danger'}`}>
                      <i className={x.pass ? 'ri-check-line' : 'ri-close-line'}></i>
                      {x.pass ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ps-totals">
            <div><strong>Mobile</strong> · Perf {ps.mobile?.performance ?? '—'} · SEO {ps.mobile?.seo ?? '—'} · A11y {ps.mobile?.accessibility ?? '—'}</div>
            <div><strong>Desktop</strong> · Perf {ps.desktop?.performance ?? '—'} · SEO {ps.desktop?.seo ?? '—'} · A11y {ps.desktop?.accessibility ?? '—'}</div>
          </div>
        </>
      ) : (
        <div className="rsec-note"><i className="ri-information-line"></i> PageSpeed data unavailable for this run — top-level Perf score shown as Not Measured.</div>
      )}

      <div className="rsec-subhead">E-E-A-T</div>
      <div className="eeat-grid">
        {eeat.map((e, i) => (
          <div key={i} className="eeat-row">
            <div className="k">{e.k}</div>
            <div className="bar">
              <div className="fill" style={{ width: `${(e.score / e.max) * 100}%` }} />
            </div>
            <div className="v">{e.score}<span>/{e.max}</span></div>
            <div className="n">{e.note}</div>
          </div>
        ))}
      </div>

      <div className="rsec-subhead">GEO readiness</div>
      <table className="tbl">
        <thead><tr><th>Signal</th><th>Score</th><th>Max</th><th>Note</th></tr></thead>
        <tbody>
          {geo.map((g, i) => (
            <tr key={i}><td><strong>{g.k}</strong></td><td>{g.value}</td><td>{g.max}</td><td>{g.note}</td></tr>
          ))}
        </tbody>
      </table>

      <div className="rsec-subhead">Keyword seeds</div>
      <div className="kw-note">{keywords.note}</div>
      <div className="kw-grid">
        {[
          ['TOFU · awareness', keywords.tofu || []],
          ['MOFU · consideration', keywords.mofu || []],
          ['BOFU · decision', keywords.bofu || []],
        ].map(([label, list], i) => (
          <div key={i} className="kw-card">
            <div className="kw-lbl">{label}</div>
            <ul>{list.map((k, j) => <li key={j}>{k}</li>)}</ul>
          </div>
        ))}
      </div>

      {tech.length ? (
        <>
          <div className="rsec-subhead">Detected tech stack</div>
          <div className="tech-chips">
            {tech.map((t, i) => (
              <span key={i} className="chip"><i className="ri-stack-line"></i> {t.name} <em>· {t.category}</em></span>
            ))}
          </div>
        </>
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
    <section id="brand" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">05</div>
        <h2>Brand assessment</h2>
      </div>

      <div className="brand-grid">
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
            <div className="row"><span>Ratings (schema)</span><strong>{ar.ratingValue ?? '—'} · {ar.reviewCount ?? '—'} reviews</strong></div>
          ) : null}
        </div>
      </div>

      <div className="brand-presence">
        <div><strong>Social:</strong> {b.socialPresenceNote || '—'}</div>
        <div><strong>Marketplace:</strong> {b.marketplacePresenceNote || '—'}</div>
      </div>

      <div className="rsec-subhead">Brand voice snapshot</div>
      <div className="voice-card">
        <div className="voice-tone"><strong>Tone:</strong> {b.voice?.tone || '—'}</div>
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
    <section id="strategy" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">06</div>
        <h2>90-day plan</h2>
      </div>
      <div className="phases">
        {(s.phases || []).map((p, i) => (
          <div key={i} className="phase-card">
            <div className="phase-name">{p.name}</div>
            <ul>{(p.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
      </div>
      {s.kpis?.length ? (
        <>
          <div className="rsec-subhead">KPI targets</div>
          <table className="tbl">
            <thead><tr><th>KPI</th><th>Target</th></tr></thead>
            <tbody>{s.kpis.map((k, i) => <tr key={i}><td><strong>{k.name}</strong></td><td>{k.target}</td></tr>)}</tbody>
          </table>
        </>
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
    <section id="swot" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">07</div>
        <h2>SWOT</h2>
      </div>
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
    { key: 'visionMission',    label: 'Vision & Mission',     icon: 'ri-compass-3-line' },
    { key: 'icp',              label: 'Ideal Customer Profile', icon: 'ri-user-3-line' },
    { key: 'monetisation',     label: 'Monetisation Strategy',  icon: 'ri-exchange-dollar-line' },
    { key: 'sales',            label: 'Sales Strategies',       icon: 'ri-chat-quote-line' },
    { key: 'brandVoiceGuide',  label: 'Brand Voice Guide',      icon: 'ri-palette-line' },
  ];

  // Tiny markdown → React renderer: headings, bullets, paragraphs.
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
    <section id="docs" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">08</div>
        <h2>Strategy documents</h2>
      </div>
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
  return (
    <section id="methodology" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">10</div>
        <h2>Methodology</h2>
      </div>
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
      <div className="rsec-note">
        <i className="ri-shield-check-line"></i>
        <span>This report uses publicly observable signals + live PageSpeed data. No per-competitor numerics are scraped — competitor details are AI-suggested qualitatively and should be verified.</span>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="rsec closing-cta">
      <div className="cta-card">
        <h3>Ready to ship this plan?</h3>
        <p>Every item in your checklist is a concrete move. Start with Do First, batch the rest. Share this report with your team.</p>
      </div>
    </section>
  );
}

window.DigitalSection = DigitalSection;
window.BrandSection = BrandSection;
window.StrategySection = StrategySection;
window.SwotSection = SwotSection;
window.DocsSection = DocsSection;
window.MethodSection = MethodSection;
window.ClosingCTA = ClosingCTA;
