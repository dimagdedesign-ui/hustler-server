/* Executive summary + classic 9-block BMC + unit economics.
 * Visually matches the Nova design reference. */

// Defensive array: agents sometimes return objects/nulls where we expect
// arrays. This keeps the report rendering even on malformed payloads.
const asArr = (v) => Array.isArray(v) ? v : [];
window.asArr = asArr;

function SectionEyebrow({ num, title, sub, icon }) {
  return (
    <div className="report-section-hd">
      <div className="section-eyebrow">
        <span className="num">{num}</span>
        <i className={icon} style={{ fontSize: 14, marginLeft: -2 }}></i>
        Section {num}
      </div>
      <h2 className="section-title">{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </div>
  );
}

function ConfPill({ level }) {
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low';
  return (
    <span className={`conf ${level}`}>
      <span className="bars">
        <span className="bar"></span><span className="bar"></span><span className="bar"></span>
      </span>
      {label}
    </span>
  );
}

function ReportHead({ onDownload, downloading }) {
  const r = window.REPORT;
  if (!r) return null;
  const m = r.meta;

  const confLabel = m.confidence === 'high' ? 'High' : m.confidence === 'medium' ? 'Medium' : 'Low';
  const hostname = (() => { try { return new URL(m.url).hostname.replace(/^www\./, ''); } catch { return m.url; } })();

  return (
    <header className="report-head">
      <div className="meta-row">
        <span><i className="ri-calendar-line" style={{ fontSize: 13, marginRight: 4, verticalAlign: -1 }}></i>{m.date}</span>
        <span className="dot"></span>
        <span>v0.1 · Sonnet 4.6</span>
        <span className="dot"></span>
        <span>
          <i className="ri-shield-check-line" style={{ fontSize: 13, marginRight: 4, verticalAlign: -1 }}></i>
          Overall confidence: <strong style={{ color: 'var(--fg)' }}>{confLabel}</strong>
        </span>
        <span className="dot"></span>
        <span><i className="ri-time-line" style={{ fontSize: 13, marginRight: 4, verticalAlign: -1 }}></i>{(m.processingMs / 1000).toFixed(1)}s</span>
      </div>

      <h1>Business analysis:<br/>{m.businessName}</h1>

      {m.tagline ? (
        <p className="biz-line" style={{ marginTop: 4 }}>
          <strong>{m.tagline}</strong>
        </p>
      ) : null}

      <div className="chips">
        <span className="badge badge-info"><i className="ri-global-line" style={{ fontSize: 12 }}></i>{hostname}</span>
        {m.userType && m.userType !== 'unknown' ? (
          <span className="badge badge-muted"><i className="ri-building-2-line" style={{ fontSize: 12 }}></i>{m.userType.replace('_', ' ')}</span>
        ) : null}
        <span className="badge badge-success"><span className="dot"></span>Live site</span>
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={onDownload} disabled={downloading}>
          <i className={downloading ? 'ri-loader-4-line spin' : 'ri-download-2-line'}></i>
          {downloading ? 'Preparing…' : 'Download .md'}
        </button>
        <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(window.location.href); }}>
          <i className="ri-share-forward-line"></i>Share
        </button>
      </div>
    </header>
  );
}

function SummarySection() {
  const r = window.REPORT;
  if (!r) return null;
  const bullets = asArr(r.executive?.bullets);
  const maturity = asArr(r.maturity?.rows);

  return (
    <section id="summary" className="report-section" style={{ paddingTop: 16 }}>
      <SectionEyebrow
        num="01"
        title="Executive summary"
        sub={`${bullets.length} findings with inline evidence. The last item is your highest-priority 30-day play.`}
        icon="ri-file-list-3-line"
      />

      <div className="card card-pad">
        <ul className="summary-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {bullets.map((it, i) => {
            const icon = it.kind === 'win' ? 'ri-check-line'
                       : it.kind === 'risk' ? 'ri-alert-line'
                       : 'ri-arrow-right-circle-fill';
            const kindLabel = it.kind === 'win' ? 'Strength'
                            : it.kind === 'risk' ? 'Risk'
                            : 'Priority move';
            return (
              <li key={i} className={`item ${it.kind}`}>
                <div className="ico"><i className={icon}></i></div>
                <div>
                  <span className="kind">{kindLabel}</span>
                  <div className="text">{it.text}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {maturity.length ? (
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div className="card-hd">
            <h3 style={{ margin: 0 }}>Maturity at a glance</h3>
          </div>
          <table className="tbl" style={{ marginTop: 12 }}>
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
      ) : null}
    </section>
  );
}

function BMCSection() {
  const r = window.REPORT;
  if (!r) return null;
  const canvas = asArr(r.businessModel?.canvas);
  const econ = r.businessModel?.unitEcon || {};

  const blockMap = {
    'Key Partnerships':       { cls: 'key-partners',   icon: 'ri-links-line' },
    'Key Activities':         { cls: 'key-activities', icon: 'ri-hammer-line' },
    'Key Resources':          { cls: 'key-resources',  icon: 'ri-database-2-line' },
    'Value Proposition':      { cls: 'value-prop',     icon: 'ri-shining-2-line' },
    'Customer Relationships': { cls: 'customer-rel',   icon: 'ri-user-voice-line' },
    'Channels':               { cls: 'channels',       icon: 'ri-road-map-line' },
    'Customer Segments':      { cls: 'customer-seg',   icon: 'ri-team-line' },
    'Cost Structure':         { cls: '',               icon: 'ri-wallet-3-line' },
    'Revenue Streams':        { cls: '',               icon: 'ri-money-pound-circle-line' },
  };
  const topKeys = ['Key Partnerships', 'Key Activities', 'Key Resources', 'Value Proposition', 'Customer Relationships', 'Channels', 'Customer Segments'];
  const bottomKeys = ['Cost Structure', 'Revenue Streams'];

  const byKey = Object.fromEntries((canvas || []).map(b => [b.key, b]));

  const renderBlock = (k) => {
    const b = byKey[k];
    const m = blockMap[k];
    if (!m) return null;
    return (
      <div key={k} className={`block ${m.cls}`}>
        <div className="k">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className={m.icon}></i>{k}
          </span>
          <ConfPill level={b?.conf || 'low'} />
        </div>
        <div className="body">{b?.text || 'Not detectable from public signals.'}</div>
      </div>
    );
  };

  // Hide cards where the value is "Not detectable" / "—" — they add no signal.
  const isDetected = (it) => {
    if (!it) return false;
    const v = String(it.value || '').toLowerCase().trim();
    if (!v || v === '—' || v === 'not detectable' || v === 'none' || v === 'unknown') return false;
    return true;
  };
  const econCards = [
    { lbl: 'Average order value',   it: econ.aov },
    { lbl: 'Active SKUs',           it: econ.skus },
    { lbl: 'Review velocity',       it: econ.reviewVelocity },
    { lbl: 'Revenue tier estimate', it: econ.revenueTier },
  ].filter(x => isDetected(x.it));

  return (
    <section id="bmc" className="report-section">
      <SectionEyebrow
        num="02"
        title="Business model analysis"
        sub="Auto-inferred Business Model Canvas with confidence signals per block. Low-confidence blocks should be verified against your actual operations before acting."
        icon="ri-briefcase-4-line"
      />

      <div className="bmc">{topKeys.map(renderBlock)}</div>
      <div className="bmc-wide">{bottomKeys.map(renderBlock)}</div>

      {econCards.length ? (
        <div className="grid-4 mt-6" style={{ marginTop: 20 }}>
          {econCards.map((x) => (
            <div key={x.lbl} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat" style={{ flex: 1 }}>
                  <div className="lbl">{x.lbl}</div>
                  <div className="val" style={{ fontSize: 28, lineHeight: '36px' }}>{x.it.value || '—'}</div>
                </div>
                <ConfPill level={x.it.conf || 'low'} />
              </div>
              {x.it.note ? <div className="note" style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{x.it.note}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

Object.assign(window, { SectionEyebrow, ConfPill, ReportHead, SummarySection, BMCSection });
