/* Intake screen — paste URL, hit Analyse, kick off real API call. */
function Intake({ initialUrl, onSubmit }) {
  const [url, setUrl] = React.useState(initialUrl || '');
  const [userType, setUserType] = React.useState('auto');
  const [err, setErr] = React.useState('');

  const AGENTS = [
    { key: 'scraper',  label: 'Scraper',          icon: 'ri-global-line',         desc: 'Reads the public signals on your page' },
    { key: 'bm',       label: 'Business Model',   icon: 'ri-function-line',       desc: 'Infers Lean Canvas + unit economics' },
    { key: 'cp',       label: 'Competitor',       icon: 'ri-swords-line',         desc: 'Suggests 5 qualitative competitor cards' },
    { key: 'dp',       label: 'Digital Presence', icon: 'ri-bar-chart-2-line',    desc: 'E-E-A-T, GEO, brand, keyword seeds' },
    { key: 'cl',       label: 'Checklist',        icon: 'ri-list-check-2',        desc: 'Synthesises 50 ICE-scored actions' },
  ];

  const submit = (e) => {
    e.preventDefault();
    const cleaned = (url || '').trim();
    if (!cleaned) { setErr('Paste a URL to start.'); return; }
    setErr('');
    onSubmit({ url: cleaned, userType: userType === 'auto' ? null : userType });
  };

  return (
    <div className="intake" data-screen-label="Intake">
      <div className="intake-hero">
        <div className="intake-eyebrow">Paste a URL · get a grounded audit</div>
        <h1 className="intake-title">An action plan to grow your product brand</h1>
        <p className="intake-sub">Paste your business website. Get a prioritised action plan tailored to your business — plus 7 strategy docs so you know exactly what to ship next to outperform in your niche.</p>

        <form className="intake-form" onSubmit={submit}>
          <div className="intake-input">
            <i className="ri-link" aria-hidden="true"></i>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourbrand.com"
              autoFocus
              spellCheck={false}
            />
          </div>
          <div className="intake-options">
            <label className={`opt ${userType === 'auto' ? 'sel' : ''}`}>
              <input type="radio" name="t" value="auto" checked={userType === 'auto'} onChange={() => setUserType('auto')} />
              <span>Auto-detect</span>
            </label>
            <label className={`opt ${userType === 'manufacturer' ? 'sel' : ''}`}>
              <input type="radio" name="t" value="manufacturer" checked={userType === 'manufacturer'} onChange={() => setUserType('manufacturer')} />
              <span>Manufacturer</span>
            </label>
            <label className={`opt ${userType === 'service_provider' ? 'sel' : ''}`}>
              <input type="radio" name="t" value="service_provider" checked={userType === 'service_provider'} onChange={() => setUserType('service_provider')} />
              <span>Service / SaaS</span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-lg intake-cta">
            Run analysis <i className="ri-arrow-right-line" aria-hidden="true"></i>
          </button>
          {err ? <div className="intake-err"><i className="ri-error-warning-line"></i> {err}</div> : null}
        </form>
      </div>

      <div className="intake-pipeline">
        <div className="intake-pipe-head">Five agents run on your URL</div>
        <div className="intake-pipe-grid">
          {AGENTS.map(a => (
            <div key={a.key} className="intake-pipe-card">
              <div className="ico"><i className={a.icon}></i></div>
              <div>
                <div className="n">{a.label}</div>
                <div className="d">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="intake-note">
          <i className="ri-shield-check-line"></i>
          <span>Public signals only. We respect <code>robots.txt</code>. Nothing is stored — your URL only leaves this server to fetch PageSpeed scores.</span>
        </div>
      </div>
    </div>
  );
}

window.Intake = Intake;
