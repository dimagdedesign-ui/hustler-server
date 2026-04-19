// Topbar — shared across all screens.
const { useState, useEffect, useRef, useMemo, useCallback } = React;

function Topbar({ theme, setTheme, showTweaks, setShowTweaks, stage, onRestart, onDownload, downloading }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="mark">AI</div>
        <div>
          <div className="brand-name">AI Business Analyst</div>
          <div className="brand-sub">Scrape → Analyse → Action plan</div>
        </div>
      </div>
      <div className="spacer" />
      {stage === 'report' && (
        <React.Fragment>
          <button className="btn btn-sm btn-secondary" onClick={onRestart}>
            <i className="ri-arrow-left-line"></i>New analysis
          </button>
          <button className="btn btn-sm btn-primary" onClick={onDownload} disabled={downloading}>
            <i className={downloading ? 'ri-loader-4-line spin' : 'ri-download-2-line'}></i>
            {downloading ? 'Preparing…' : 'Download .md'}
          </button>
        </React.Fragment>
      )}
      <button className="icon-btn" title="Tweaks" onClick={() => setShowTweaks(!showTweaks)}>
        <i className="ri-equalizer-2-line"></i>
      </button>
      <button
        className="icon-btn"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'}></i>
      </button>
    </div>
  );
}

Object.assign(window, { Topbar });
