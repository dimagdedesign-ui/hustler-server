/* Competitors — design's .comp-row / .threat styling with our grounded JSON.
 * Drops: 2D positioning matrix, SOV proxy, per-competitor DA/velocity/review
 * counts (none of those are scraped or measured). Keeps: threat score,
 * positioning sentence, key weakness. */

function CompetitorsSection() {
  const r = window.REPORT;
  if (!r) return null;
  // Accept array OR object-with-numeric-keys from less-disciplined agent outputs.
  const raw = r.competitor?.list;
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
  const disclaimer = r.competitor?.disclaimer
    || 'Competitors suggested by AI based on niche inference — verify against your own research before acting.';

  const tierCls = (t) => t === 'high' ? 'badge-danger' : t === 'medium' ? 'badge-warn' : 'badge-success';

  return (
    <section id="competitors" className="report-section">
      <SectionEyebrow
        num="03"
        title="Competitive landscape"
        sub="5 suggested rivals with AI-estimated threat composite, positioning line, and a single observable weakness to exploit. Numeric per-competitor data (DA, ad spend, review counts) isn't scraped — it's intentionally omitted rather than fabricated."
        icon="ri-crosshair-2-line"
      />

      <div className="comp-list">
        {list.map((c, i) => (
          <div key={i} className="comp-row">
            <div>
              <div className="name">{c.name}</div>
              <div className="domain">{c.domain}</div>
              <div className="weakness">
                <i className="ri-lightbulb-line" style={{ fontSize: 13, marginRight: 4, color: 'var(--badge-warn-fg)', verticalAlign: -1 }}></i>
                Gap to exploit: {c.weakness}
              </div>
              <div style={{ marginTop: 8, font: '400 13px/1.5 var(--font-sans)', color: 'var(--fg-muted)' }}>
                <strong style={{ color: 'var(--fg)' }}>Positioning:</strong> {c.positioning}
              </div>
              <div className="signals mt-2">
                <span className={`badge ${tierCls(c.threatTier)}`}>
                  <span className="dot"></span>{c.threatTier} threat
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="threat-lbl">Threat</div>
              <div className="threat">
                {Number(c.threat || 0).toFixed(1)}
                <span style={{ fontSize: 14, color: 'var(--fg-subtle)', letterSpacing: 0 }}>/10</span>
              </div>
            </div>
            <div>
              <a className="btn btn-sm btn-secondary" href={`https://${c.domain}`} target="_blank" rel="noreferrer noopener">
                <i className="ri-external-link-line"></i>Visit
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 16, background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i className="ri-information-line" style={{ color: 'var(--fg-subtle)', fontSize: 16, marginTop: 2 }}></i>
          <div style={{ font: '400 13px/1.5 var(--font-sans)', color: 'var(--fg-muted)' }}>{disclaimer}</div>
        </div>
      </div>
    </section>
  );
}

window.CompetitorsSection = CompetitorsSection;
