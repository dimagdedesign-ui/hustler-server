/* 50-item ICE action checklist — consumes REPORT.checklist.
 * Features: search, category filter, quadrant grouping, done-state persisted
 * to localStorage, progress ring. */
function ChecklistSection() {
  const r = window.REPORT;
  if (!r) return null;
  const items = Array.isArray(r.checklist) ? r.checklist : [];
  const storageKey = `aiba-done:${r.meta?.slug || 'default'}`;

  const [done, setDone] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [expand, setExpand] = React.useState({});

  React.useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(done)); } catch {}
  }, [done, storageKey]);

  const categories = React.useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return ['all', ...set];
  }, [items]);

  const quadrants = ['Do First', 'Plan', 'Batch', 'Deprioritise'];

  const filtered = items.filter(it => {
    if (cat !== 'all' && it.category !== cat) return false;
    if (search && !(
      (it.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (it.why || '').toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  const grouped = quadrants.map(q => ({ q, items: filtered.filter(it => it.quadrant === q) }));

  const total = items.length;
  const completed = Object.values(done).filter(Boolean).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const toggle = (id) => setDone(d => ({ ...d, [id]: !d[id] }));
  const toggleExpand = (id) => setExpand(e => ({ ...e, [id]: !e[id] }));

  const effortClass = (e) => e === 'Low' ? 'eff-low' : e === 'Medium' ? 'eff-med' : 'eff-high';
  const quadClass = (q) => q === 'Do First' ? 'q-do' : q === 'Plan' ? 'q-plan' : q === 'Batch' ? 'q-batch' : 'q-dep';

  return (
    <section id="checklist" className="report-section">
      <SectionEyebrow
        num="09"
        title={`Action checklist · ${total} ICE-scored moves`}
        sub="ICE scores: Impact × Confidence × Ease. Start with Do First, schedule the Plan group, batch the long-tail. Done-state persists locally."
        icon="ri-list-check-2"
      />

      <div className="cl-progress">
        <svg viewBox="0 0 40 40" className="ring">
          <circle cx="20" cy="20" r="17" className="track" />
          <circle cx="20" cy="20" r="17" className="fill" style={{ strokeDasharray: `${pct * 1.068} 1000` }} />
        </svg>
        <div>
          <div className="cl-progress-num">{completed}<span>/{total}</span></div>
          <div className="cl-progress-lbl">Actions done · {pct}%</div>
        </div>
      </div>

      <div className="cl-filters">
        <div className="cl-search">
          <i className="ri-search-line"></i>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actions…" />
        </div>
        <div className="cl-cats">
          {categories.map(c => (
            <button key={c} className={`cl-cat ${c === cat ? 'sel' : ''}`} onClick={() => setCat(c)}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {grouped.map(g => g.items.length ? (
        <div key={g.q} className="cl-group">
          <div className={`cl-group-hd ${quadClass(g.q)}`}>
            <span className="cl-group-tag">{g.q}</span>
            <span className="cl-group-count">{g.items.length} {g.items.length === 1 ? 'action' : 'actions'}</span>
          </div>
          {g.items.map(it => {
            const isOpen = !!expand[it.id];
            const isDone = !!done[it.id];
            return (
              <div key={it.id} className={`check-item ${isDone ? 'checked' : ''}`}>
                <div className="ci-hd">
                  <input type="checkbox" checked={isDone} onChange={() => toggle(it.id)} />
                  <div className="ci-title">
                    <div className="title">{it.title}</div>
                    <div className="ci-meta">
                      <span className="chip chip-ghost">{it.category}</span>
                      <span className={`chip ${effortClass(it.effort)}`}>{it.effort} effort</span>
                      <span className="chip chip-ice">ICE {Number(it.ice).toFixed(1)}</span>
                      <span className="chip chip-ghost">I {it.impact} · C {it.confidence} · E {it.ease}</span>
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => toggleExpand(it.id)} aria-label="Expand">
                    <i className={isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  </button>
                </div>
                {isOpen ? (
                  <div className="ci-bd">
                    <div className="ci-why"><strong>Why it matters:</strong> {it.why}</div>
                    {Array.isArray(it.steps) && it.steps.length ? (
                      <ol className="ci-steps">{it.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null)}

      {!filtered.length ? <div className="cl-empty">No actions match that filter.</div> : null}
    </section>
  );
}

window.ChecklistSection = ChecklistSection;
