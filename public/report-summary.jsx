/* Executive summary + Lean Canvas + Unit Economics. All from REPORT. */
function confEmoji(c) { return c === 'high' ? '🟢' : c === 'medium' ? '🟡' : '🔴'; }
function confLabel(c) { return c === 'high' ? 'High' : c === 'medium' ? 'Medium' : 'Low'; }

function ReportHead() {
  const r = window.REPORT;
  if (!r) return null;
  const m = r.meta;

  return (
    <section className="report-head">
      <div className="rh-main">
        <div className="rh-eyebrow">Business Audit Report</div>
        <h1 className="rh-title">{m.businessName}</h1>
        {m.tagline ? <p className="rh-sub">{m.tagline}</p> : null}
        <div className="rh-meta">
          <span className="rh-chip"><i className="ri-global-line"></i> {m.url}</span>
          <span className="rh-chip"><i className="ri-calendar-line"></i> {m.date}</span>
          <span className="rh-chip"><i className="ri-building-line"></i> {m.userType}</span>
          <span className="rh-chip"><i className="ri-compass-line"></i> Confidence: {confEmoji(m.confidence)} {confLabel(m.confidence)}</span>
          <span className="rh-chip"><i className="ri-time-line"></i> {(m.processingMs / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </section>
  );
}

function SummarySection() {
  const r = window.REPORT;
  if (!r) return null;
  const bullets = r.executive?.bullets || [];
  const maturity = r.maturity?.rows || [];

  const kindIcon = (k) => k === 'win' ? 'ri-medal-line' : k === 'risk' ? 'ri-alert-line' : 'ri-flashlight-line';
  const kindLabel = (k) => k === 'win' ? 'Win' : k === 'risk' ? 'Risk' : 'Action';

  return (
    <section id="summary" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">01</div>
        <h2>Executive summary</h2>
      </div>
      <div className="exec-bullets">
        {bullets.map((b, i) => (
          <div key={i} className={`exec-bullet k-${b.kind}`}>
            <div className="icon"><i className={kindIcon(b.kind)}></i></div>
            <div className="body">
              <div className="tag">{kindLabel(b.kind)}</div>
              <div className="text">{b.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="maturity-card">
        <div className="rsec-subhead">Maturity at a glance</div>
        <table className="tbl">
          <thead><tr><th>Dimension</th><th>Stage</th><th>Level</th><th>Assessment</th></tr></thead>
          <tbody>
            {maturity.map((m, i) => (
              <tr key={i}>
                <td><strong>{m.dimension}</strong></td>
                <td><span className="stage-pill">{m.stage}/4</span></td>
                <td>{m.level}</td>
                <td>{m.assessment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BMCSection() {
  const r = window.REPORT;
  if (!r) return null;
  const canvas = r.businessModel?.canvas || [];
  const econ = r.businessModel?.unitEcon || {};

  return (
    <section id="bmc" className="rsec">
      <div className="rsec-head">
        <div className="rsec-index">02</div>
        <h2>Business model — Lean Canvas</h2>
      </div>
      <div className="bmc-grid">
        {canvas.map((b, i) => (
          <div key={i} className={`bmc-block c-${b.conf}`}>
            <div className="bmc-k">{b.key}</div>
            <div className="bmc-conf">{confEmoji(b.conf)} <span>{confLabel(b.conf)}</span></div>
            <div className="bmc-t">{b.text}</div>
          </div>
        ))}
      </div>

      <div className="rsec-subhead">Unit economics</div>
      <div className="econ-grid">
        {[
          ['AOV', econ.aov],
          ['Price Range', econ.priceRange],
          ['Revenue Tier', econ.revenueTier],
          ['Review Velocity', econ.reviewVelocity],
        ].map(([label, data], i) => (
          <div key={i} className="econ-card">
            <div className="econ-k">{label}</div>
            <div className="econ-v">{data?.value || '—'}</div>
            <div className="econ-note">{confEmoji(data?.conf)} {data?.note || '—'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.ReportHead = ReportHead;
window.SummarySection = SummarySection;
window.BMCSection = BMCSection;
