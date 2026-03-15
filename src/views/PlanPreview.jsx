import React, { useState } from 'react';
import { Logo, DayBlock } from '../components/Common';
import { CorrectionPanel } from '../components/Modals';

export default function PlanPreview({ plan, setPlan, onAccept, onReset }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { week, profile } = plan;
  
  const trainDays = week.filter(d => d.type === 'training').length;
  const totalEx = week.reduce((s, d) => s + (d.exercises?.length || 0), 0);
  const totalSets = week.reduce((s, d) => s + (d.exercises?.reduce((ss, e) => ss + e.sets, 0) || 0), 0);
  
  const handleFB = (di, ei, fb, sg) => setPlan(p => ({...p, week: p.week.map((d, i) => i !== di ? d : {...d, exercises: d.exercises.map((ex, j) => j !== ei ? ex : {...ex, feedback: fb, suggestion: sg})})}));
  const clean = s => s.replace(/[💪🏋️🔥🌱⚡🔱🏪🏠🤸✅🦵🦴]/g, '').trim();

  // NOWE: Funkcja zarządzająca ręcznymi modyfikacjami w trybie podglądu (przed zapisem)
  const handleModifyPlan = (di, action, ei, newData) => setPlan(p => {
    return {
      ...p, 
      week: p.week.map((d, i) => {
        if (i !== di) return d;
        const exercises = [...(d.exercises || [])];
        if (action === 'add') exercises.push(newData);
        else if (action === 'edit') exercises[ei] = { ...exercises[ei], ...newData };
        else if (action === 'delete') exercises.splice(ei, 1);
        return { ...d, exercises };
      })
    };
  });

  return (
    <div className="app-shell">
      <div className="top-bar">
        <Logo />
        <div className="phase-indicator"><div className="phase-dot"></div>PODGLĄD PLANU</div>
      </div>
      <div className={`plan-wrap${panelOpen ? ' panel-open' : ''}`}>
        <div className="plan-view">
          <div className="plan-content">
            <div className="dash-header">
              <div className="dash-title">TWÓJ <span>EVO</span><br/>PLAN</div>
              <div className="dash-meta">
                <div className="meta-pill"><span className="dot"></span>{clean(profile.goal)}</div>
                <div className="meta-pill"><span className="dot"></span>{clean(profile.experience)}</div>
                <div className="meta-pill"><span className="dot"></span>{clean(profile.equipment)}</div>
              </div>
            </div>
            <div className="stats-bar">
              <div className="stat-cell"><div className="stat-num">{trainDays}</div><div className="stat-lbl">Dni treningu</div></div>
              <div className="stat-cell"><div className="stat-num">{totalEx}</div><div className="stat-lbl">Ćwiczeń</div></div>
              <div className="stat-cell"><div className="stat-num">{totalSets}</div><div className="stat-lbl">Serii łącznie</div></div>
            </div>
            <div className="week-grid">
              {week.map((d, i) => (
                <DayBlock 
                  key={i} 
                  dayData={d} 
                  dayIdx={i} 
                  onFeedback={handleFB} 
                  onModifyPlan={handleModifyPlan} 
                />
              ))}
            </div>
          </div>
          <div className="accept-bar">
            <div className="accept-bar-inner">
              <button className="btn-secondary" onClick={onReset}>← Nowy wywiad</button>
              <button className="btn-accept" onClick={onAccept}><span>✓ ZAAKCEPTUJ PLAN</span></button>
            </div>
          </div>
        </div>
        {panelOpen && <CorrectionPanel plan={plan} onUpdatePlan={setPlan} onClose={() => setPanelOpen(false)} />}
      </div>
      <button className={`ai-fab${panelOpen ? ' active' : ''}`} onClick={() => setPanelOpen(!panelOpen)} style={panelOpen ? {right: 'calc(var(--panel-w) + 16px)'} : {}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <span>{panelOpen ? 'Zamknij AI' : 'Koryguj z AI'}</span>
      </button>
    </div>
  );
}