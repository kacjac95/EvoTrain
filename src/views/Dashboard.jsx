import React, { useState, useMemo } from 'react';
import { Logo, DayBlock } from '../components/Common';
import { CorrectionPanel, SessionLogModal } from '../components/Modals';
import { WeeklyVolumeChart, ExProgressChart } from '../components/Charts';
import { calcStreak, thisWeekCount, saveSess, savePlan, clearAll } from '../utils/helpers';

export default function ProgressDashboard({ plan, setPlan, sessions, setSessions, onNewPlan }) {
  const [tab, setTab] = useState('progress');
  const [showModal, setShowModal] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const streak = useMemo(() => calcStreak(sessions), [sessions]);
  const thisWeek = useMemo(() => thisWeekCount(sessions), [sessions]);
  const totalVol = useMemo(() => sessions.reduce((t, s) => t + (s.totalVol || 0), 0), [sessions]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSaveSession = session => {
    const updated = [{...session, id: Date.now(), date: new Date().toISOString()}, ...sessions];
    setSessions(updated); 
    saveSess(updated);
    setShowModal(false);
    showToast('Sesja zapisana! ✓');
  };

  const clean = s => s.replace(/[💪🏋️🔥🌱⚡🔱🏪🏠🤸✅🦵🦴]/g, '').trim();

  const handleFB = (di, ei, fb, sg) => setPlan(p => {
    const np = {...p, week: p.week.map((d, i) => i !== di ? d : {...d, exercises: d.exercises.map((ex, j) => j !== ei ? ex : {...ex, feedback: fb, suggestion: sg})})};
    savePlan(np); 
    return np;
  });

  return (
    <div className="app-shell">
      <div className="top-bar">
        <Logo />
        <div className="top-nav">
          <button className={`top-nav-btn${tab === 'progress' ? ' active' : ''}`} onClick={() => setTab('progress')}>Postęp</button>
          <button className={`top-nav-btn${tab === 'plan' ? ' active' : ''}`} onClick={() => setTab('plan')}>Plan</button>
        </div>
        <div className="phase-indicator"><div className="phase-dot"></div>DASHBOARD</div>
      </div>

      {tab === 'progress' && (
        <div className="progress-shell">
          <div className="progress-content">
            <div className="kpi-grid">
              <div className="kpi-card neon"><div className="kpi-icon">🔥</div><div className="kpi-val">{streak}</div><div className="kpi-label">Streak (dni)</div></div>
              <div className="kpi-card blue"><div className="kpi-icon">🏋️</div><div className="kpi-val">{sessions.length}</div><div className="kpi-label">Sesje łącznie</div></div>
              <div className="kpi-card orange"><div className="kpi-icon">📅</div><div className="kpi-val">{thisWeek}</div><div className="kpi-label">Treningi w tygodniu</div></div>
              <div className="kpi-card purple"><div className="kpi-icon">⚡</div><div className="kpi-val">{totalVol > 9999 ? Math.round(totalVol / 1000) + 'k' : totalVol}</div><div className="kpi-label">Łączny wolumen (kg)</div></div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-card-header">
                  <div className="chart-card-title">WOLUMEN TYGODNIOWY</div>
                  <div className="chart-card-sub">Ostatnie 8 tygodni</div>
                </div>
                <WeeklyVolumeChart sessions={sessions} />
              </div>
              <div className="chart-card">
                <div className="chart-card-header">
                  <div className="chart-card-title">PROGRES ĆWICZENIA</div>
                  <div className="chart-card-sub">Ciężar i powtórzenia w czasie</div>
                </div>
                <ExProgressChart sessions={sessions} />
              </div>
            </div>

            <div className="sessions-section">
              <div className="section-title">
                <span>OSTATNIE SESJE</span>
                {sessions.length > 0 && <span style={{fontSize: '.7rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono,monospace'}}>{sessions.length} łącznie</span>}
              </div>
              {sessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">BRAK SESJI</div>
                  <div className="empty-text">Zaloguj swój pierwszy trening aby<br/>zacząć śledzić postępy i statystyki.</div>
                  <button className="btn-accept" style={{maxWidth: '220px', margin: '0 auto', fontSize: '.9rem', letterSpacing: '1px'}} onClick={() => setShowModal(true)}>+ Zaloguj trening</button>
                </div>
              ) : (
                sessions.slice(0, 8).map(s => (
                  <div key={s.id} className="session-card">
                    <div className="session-info">
                      <div className="session-label">{s.dayLabel}</div>
                      <div className="session-date">{new Date(s.date).toLocaleDateString('pl-PL', {weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'})}</div>
                    </div>
                    <div className="session-stats">
                      <div className="s-stat"><div className="s-val">{s.totalSets}</div><div className="s-lbl">Serie</div></div>
                      <div className="s-stat"><div className="s-val">{s.totalVol > 999 ? Math.round(s.totalVol / 1000) + 'k' : s.totalVol}</div><div className="s-lbl">Vol</div></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{paddingTop: '8px'}}>
              <button className="btn-ghost" onClick={() => { if(window.confirm('Tworzenie nowego planu usunie bieżące dane. Kontynuować?')) { clearAll(); onNewPlan(); } }}>← Nowy wywiad</button>
            </div>
          </div>
          <button className="log-fab" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Zaloguj trening</span>
          </button>
        </div>
      )}

      {tab === 'plan' && (
        <div className={`plan-wrap${panelOpen ? ' panel-open' : ''}`}>
          <div className="plan-view">
            <div className="plan-content">
              <div className="dash-header">
                <div className="dash-title">AKTYWNY <span>PLAN</span></div>
                <div className="dash-meta">
                  <div className="meta-pill"><span className="dot"></span>{clean(plan.profile.goal)}</div>
                  <div className="meta-pill"><span className="dot"></span>{clean(plan.profile.equipment)}</div>
                  {plan.acceptedAt && <div className="meta-pill"><span className="dot"></span>Zaakceptowano: {new Date(plan.acceptedAt).toLocaleDateString('pl-PL')}</div>}
                </div>
              </div>
              <div className="week-grid">
                {plan.week.map((d, i) => <DayBlock key={i} dayData={d} dayIdx={i} onFeedback={handleFB} />)}
              </div>
            </div>
          </div>
          {panelOpen && <CorrectionPanel plan={plan} onUpdatePlan={p => { setPlan(prev => { const np = p(prev); savePlan(np); return np; }); }} onClose={() => setPanelOpen(false)} />}
          <button className={`ai-fab${panelOpen ? ' active' : ''}`} onClick={() => setPanelOpen(!panelOpen)} style={panelOpen ? {right: 'calc(var(--panel-w) + 16px)'} : {}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span>{panelOpen ? 'Zamknij AI' : 'Koryguj z AI'}</span>
          </button>
        </div>
      )}

      {showModal && <SessionLogModal plan={plan} onSave={handleSaveSession} onClose={() => setShowModal(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}