/* Competitive landscape — 1D threat bar (not 2D) + 5 cards.
 * Per-competitor numerics that aren't measured are intentionally absent. */
function CompetitorsSection() {
  const r = window.REPORT;
  if (!r) return null;
  const list = r.competitor?.list || [];
  const disclaimer = r.competitor?.disclaimer || 'Competitors suggested by AI — verify with your own research.';

  const tierColor = (t) => t === 'high' ? 'var(--semantic-danger)' : t === 'medium' ? 'var(--semantic-warning)' : 'var(--semantic-success)';

  return (
    <section id="competitors" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">03</div>
        <h2>Competitive landscape</h2>
      </div>

      <div className="comp-bars">
        {list.map((c, i) => (
          <div key={i} className="comp-bar-row">
            <div className="comp-bar-name">
              <strong>{c.name}</strong>
              <span className="comp-bar-domain">{c.domain}</span>
            </div>
            <div className="comp-bar-track">
              <div className="comp-bar-fill" style={{ width: `${(c.threat || 0) * 10}%`, background: tierColor(c.threatTier) }} />
            </div>
            <div className="comp-bar-score">{Number(c.threat || 0).toFixed(1)} <span>/ 10</span></div>
          </div>
        ))}
      </div>

      <div className="comp-cards">
        {list.map((c, i) => (
          <div key={i} className="comp-card">
            <div className="comp-card-head">
              <div>
                <div className="comp-card-name">{c.name}</div>
                <div className="comp-card-domain">{c.domain}</div>
              </div>
              <span className={`comp-tier t-${c.threatTier}`}>{c.threatTier} threat</span>
            </div>
            <div className="comp-card-pos"><strong>Position:</strong> {c.positioning}</div>
            <div className="comp-card-weak"><strong>Key weakness:</strong> {c.weakness}</div>
          </div>
        ))}
      </div>

      <div className="rsec-note">
        <i className="ri-information-line"></i>
        <span>{disclaimer}</span>
      </div>
    </section>
  );
}

window.CompetitorsSection = CompetitorsSection;
