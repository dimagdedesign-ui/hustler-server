/* Pipeline screen — shows the 5-agent run while the real /api/analyse request
 * is in flight. Agent progress is a simulated animation that caps at 90%
 * until the API response returns; then we snap to 100% and hand off. */
function RunScreen({ url, apiState, onComplete, onRestart }) {
  const AGENTS = [
    { key: 'scraper', label: 'Scraper',          icon: 'ri-global-line',         weight: 6  },
    { key: 'bm',      label: 'Business Model',   icon: 'ri-function-line',       weight: 14 },
    { key: 'cp',      label: 'Competitor',       icon: 'ri-swords-line',         weight: 14 },
    { key: 'dp',      label: 'Digital Presence', icon: 'ri-bar-chart-2-line',    weight: 14 },
    { key: 'cl',      label: 'Checklist',        icon: 'ri-list-check-2',        weight: 20 },
    { key: 'asm',     label: 'Assembler',        icon: 'ri-draft-line',          weight: 10 },
  ];
  const TOTAL = AGENTS.reduce((s, a) => s + a.weight, 0);

  const [progress, setProgress] = React.useState(0);       // 0–100
  const [log, setLog] = React.useState([{ t: Date.now(), kind: 'info', text: `Starting on ${url}…` }]);

  // Animated progress — runs until the API resolves; caps at 90%.
  React.useEffect(() => {
    if (apiState.status === 'success' || apiState.status === 'error') return;
    const iv = setInterval(() => {
      setProgress(p => (p < 88 ? p + (Math.random() * 1.5 + 0.4) : 88 + Math.random() * 0.4));
    }, 400);
    return () => clearInterval(iv);
  }, [apiState.status]);

  // Log breadcrumbs tied to agent thresholds.
  React.useEffect(() => {
    if (apiState.status !== 'pending') return;
    const markers = [
      { at: 8,  text: 'Scrape + PageSpeed in flight' },
      { at: 25, text: 'Business Model · Competitor · Digital Presence running in parallel' },
      { at: 55, text: 'Checklist agent composing 50 ICE-scored moves' },
      { at: 80, text: 'Assembler stitching executive summary · SWOT · 90-day plan' },
    ];
    const hit = markers.find(m => progress >= m.at && !log.some(l => l.text === m.text));
    if (hit) setLog(l => [...l, { t: Date.now(), kind: 'info', text: hit.text }]);
  }, [progress, apiState.status, log]);

  // Success / error transitions.
  React.useEffect(() => {
    if (apiState.status === 'success') {
      setProgress(100);
      setLog(l => [...l, { t: Date.now(), kind: 'success', text: `Report ready — ${apiState.report?.checklist?.length ?? 0} action items` }]);
      const t = setTimeout(() => onComplete(apiState.report), 450);
      return () => clearTimeout(t);
    }
    if (apiState.status === 'error') {
      setLog(l => [...l, { t: Date.now(), kind: 'error', text: apiState.error || 'Analysis failed' }]);
    }
  }, [apiState.status, apiState.report, apiState.error, onComplete]);

  // Per-agent visual state — derived from progress + weights.
  const agentState = (() => {
    let sum = 0;
    return AGENTS.map(a => {
      const start = (sum / TOTAL) * 100;
      sum += a.weight;
      const end = (sum / TOTAL) * 100;
      const pct = progress < start ? 0 : progress >= end ? 100 : ((progress - start) / (end - start)) * 100;
      const status = pct >= 100 ? 'done' : pct > 0 ? 'active' : 'queued';
      return { ...a, start, end, pct, status };
    });
  })();

  return (
    <div className="pipeline" data-screen-label="Pipeline">
      <div className="pipeline-head">
        <div>
          <div className="pipeline-eyebrow">Analysing</div>
          <div className="pipeline-url"><i className="ri-global-line"></i> {url}</div>
        </div>
        <div className="pipeline-percent">{Math.round(progress)}%</div>
      </div>
      <div className="pipeline-bar"><div className="pipeline-bar-fill" style={{ width: `${progress}%` }} /></div>

      <div className="pipeline-agents">
        {agentState.map(a => (
          <div key={a.key} className={`agent-row ${a.status}`}>
            <div className="ico">
              <i className={a.status === 'done' ? 'ri-check-line' : a.icon}></i>
            </div>
            <div className="name">{a.label}</div>
            <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${a.pct}%` }} /></div>
            <div className="state">{a.status === 'done' ? 'done' : a.status === 'active' ? 'running' : 'queued'}</div>
          </div>
        ))}
      </div>

      <div className="pipeline-log">
        {log.map((l, i) => (
          <div key={i} className={`log-row ${l.kind}`}>
            <i className={l.kind === 'error' ? 'ri-error-warning-line' : l.kind === 'success' ? 'ri-checkbox-circle-line' : 'ri-arrow-right-s-line'}></i>
            <span>{l.text}</span>
          </div>
        ))}
      </div>

      {apiState.status === 'error' && (
        <div className="pipeline-error-card">
          <div className="title"><i className="ri-error-warning-line"></i> Analysis failed</div>
          <div className="msg">{apiState.error || 'Unknown error.'}</div>
          <button className="btn btn-primary" onClick={onRestart}>Back to start</button>
        </div>
      )}
    </div>
  );
}

window.RunScreen = RunScreen;
