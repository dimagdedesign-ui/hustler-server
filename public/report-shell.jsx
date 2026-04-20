// Report shell — left nav. ReportHead is defined in report-summary.jsx.

const SECTIONS = [
  { id: 'summary',     num: '01', title: 'Executive summary',     icon: 'ri-file-list-3-line' },
  { id: 'bmc',         num: '02', title: 'Business model',        icon: 'ri-briefcase-4-line' },
  { id: 'competitors', num: '03', title: 'Competitive landscape', icon: 'ri-crosshair-2-line' },
  { id: 'digital',     num: '04', title: 'Digital presence',      icon: 'ri-pulse-line' },
  { id: 'brand',       num: '05', title: 'Brand assessment',      icon: 'ri-palette-line' },
  { id: 'strategy',    num: '06', title: '30-day plan',           icon: 'ri-calendar-schedule-line' },
  { id: 'swot',        num: '07', title: 'SWOT',                  icon: 'ri-focus-3-line' },
  { id: 'docs',        num: '08', title: 'Strategy docs',         icon: 'ri-folder-3-line' },
  { id: 'checklist',   num: '09', title: 'Action checklist',      icon: 'ri-list-check-2' },
  { id: 'methodology', num: '10', title: 'Methodology',           icon: 'ri-shield-check-line' },
];

function ReportNav({ activeId, onJump }) {
  return (
    <nav className="report-nav">
      <div className="nav-head">Report sections</div>
      {SECTIONS.map((s) => (
        <div key={s.id} className={`nav-item ${activeId === s.id ? 'active' : ''}`} onClick={() => onJump(s.id)}>
          <span className="num">{s.num}</span>
          <span>{s.title}</span>
        </div>
      ))}
    </nav>
  );
}

Object.assign(window, { SECTIONS, ReportNav });
