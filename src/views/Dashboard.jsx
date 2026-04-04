import React, { useState, useMemo, useEffect } from 'react';
import { Logo, DayBlock } from '../components/Common';
import { CorrectionPanel, SessionLogModal, SessionDetailModal } from '../components/Modals';
import { WeeklyVolumeChart, ExProgressChart } from '../components/Charts';
import { calcStreak, thisWeekCount, saveSess, savePlan, clearAll, saveParams } from '../utils/helpers';
import { supabase } from '../config/supabase';

export default function ProgressDashboard({ plan, setPlan, sessions, setSessions, onNewPlan }) {
  const [tab, setTab] = useState('progress');
  const [showModal, setShowModal] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewSession, setViewSession] = useState(null); 

  const [userEmail, setUserEmail] = useState('Ładowanie...');
  const [userParams, setUserParams] = useState(() => {
    const saved = localStorage.getItem('evotrain_user_params');
    return saved ? JSON.parse(saved) : { weight: '', height: '', age: '' };
  });

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      if (data?.user) setUserEmail(data.user.email);
    });
  }, []);

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

  const handleSaveParams = (e) => {
    e.preventDefault();
    saveParams(userParams); 
    showToast('Parametry zostały zapisane w chmurze! ✓');
  };

  // --- ZAKTUALIZOWANA FUNKCJA: GENERATOR DANYCH NA BAZIE PLANU ---
  const handleGenerateFakeData = () => {
    if(!window.confirm('To usunie Twoją obecną historię i wygeneruje 8 tygodni danych testowych na podstawie obecnego planu. Kontynuować?')) return;
    
    // Filtrujemy tylko te dni, które faktycznie są dniami treningowymi w aktywnym planie
    const trainingDays = plan.week.filter(d => d.type === 'training');
    if (trainingDays.length === 0) {
      alert("Twój obecny plan nie zawiera dni treningowych!");
      return;
    }

    const fakeSessions = [];
    const now = new Date();
    
    // Generator: Idziemy od 8 tygodni wstecz do dzisiaj
    for (let w = 8; w >= 0; w--) {
      // Dla każdego tygodnia symulujemy wykonanie wszystkich treningów z planu
      trainingDays.forEach((tDay, i) => {
        // Obliczamy sztuczną datę (np. pierwszy trening w tygodniu to poniedziałek, drugi to środa itd.)
        const d = new Date(now);
        // Rozkładamy treningi co 2 dni (w przybliżeniu) dla realistycznego efektu
        const offset = i * 2; 
        d.setDate(now.getDate() - (w * 7) - (7 - offset)); 
        
        // Nie chcemy tworzyć treningów z przyszłości
        if (d > now) return; 

        // Im dalej w przeszłość (w = 8), tym mniejszy ciężar startowy. Im bliżej teraźniejszości (w = 0), tym większy.
        const progMultiplier = (8 - w); 

        // Generujemy listę wygenerowanych serii dla konkretnego dnia z planu
        const exercises = tDay.exercises.map(ex => {
          const setsCount = Number(ex.sets) || 3;
          // Wyciągamy docelowe powtórzenia z planu (np. "8" z "8-12")
          const targetReps = ex.reps ? parseInt(ex.reps.toString().match(/\d+/)?.[0] || '8') : 8;
          
          // Generujemy "bazowy ciężar" w zależności od ćwiczenia, aby to jakoś wyglądało
          // Im większe partie, tym większy ciężar bazowy
          let baseWeight = 20;
          if (ex.cat === 'Legs') baseWeight = 60;
          if (ex.cat === 'Pull') baseWeight = 50;
          if (ex.cat === 'Push') baseWeight = 40;
          
          // Z czasem dorzucamy kilogramy, żeby był progres
          const currentWeight = baseWeight + (progMultiplier * 2.5);

          const generatedSets = Array(setsCount).fill(null).map(() => ({
            reps: targetReps,
            weight: currentWeight
          }));

          return {
            id: ex.id,
            name: ex.name,
            cat: ex.cat,
            sets: generatedSets
          };
        });

        // Obliczanie statystyk łącznych dla całej sesji
        const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        const totalVol = exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, set) => sAcc + (set.reps * set.weight), 0), 0);

        fakeSessions.push({
          id: d.getTime() + i, // Unikalne ID
          date: d.toISOString(),
          dayLabel: tDay.label, // Bierzemy nazwę z planu (np. "PUSH A", "FULL BODY")
          totalSets,
          totalVol,
          exercises
        });
      });
    }
    
    // Upewniamy się, że najnowsze sesje są na górze
    fakeSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setSessions(fakeSessions);
    saveSess(fakeSessions); // Zapis i wysyłka do Supabase
    showToast('Wygenerowano historię z Twojego planu! 🚀');
  };
  // ------------------------------------------------

  const clean = s => s ? s.replace(/[💪🏋️🔥🌱⚡🔱🏪🏠🤸✅🦵🦴]/g, '').trim() : '';

  const handleFB = (di, ei, fb, sg) => setPlan(p => {
    const np = {...p, week: p.week.map((d, i) => i !== di ? d : {...d, exercises: d.exercises.map((ex, j) => j !== ei ? ex : {...ex, feedback: fb, suggestion: sg})})};
    savePlan(np); 
    return np;
  });

  const handleModifyPlan = (di, action, ei, newData) => setPlan(p => {
    const np = {
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
    savePlan(np); 
    return np;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
  };

  return (
    <div className="app-shell">
      <div className="top-bar">
        <Logo />
        <div className="top-nav">
          <button className={`top-nav-btn${tab === 'progress' ? ' active' : ''}`} onClick={() => setTab('progress')}>Postęp</button>
          <button className={`top-nav-btn${tab === 'plan' ? ' active' : ''}`} onClick={() => setTab('plan')}>Plan</button>
          <button className={`top-nav-btn${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>Profil</button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="phase-indicator"><div className="phase-dot"></div>DASHBOARD</div>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '0.75rem', borderColor: '#ff444455', color: '#ff4444' }}>Wyloguj</button>
        </div>
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
              <div className="chart-card"><div className="chart-card-header"><div className="chart-card-title">WOLUMEN TYGODNIOWY</div><div className="chart-card-sub">Ostatnie 8 tygodni</div></div><WeeklyVolumeChart sessions={sessions} /></div>
              <div className="chart-card"><div className="chart-card-header"><div className="chart-card-title">PROGRES ĆWICZENIA</div><div className="chart-card-sub">Ciężar i powtórzenia w czasie</div></div><ExProgressChart sessions={sessions} /></div>
            </div>

            <div className="sessions-section">
              <div className="section-title">OSTATNIE SESJE</div>
              {sessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">BRAK SESJI</div>
                  <button className="btn-accept" style={{maxWidth: '220px', margin: '0 auto'}} onClick={() => setShowModal(true)}>+ Zaloguj trening</button>
                </div>
              ) : (
                sessions.slice(0, 8).map(s => (
                  <div key={s.id} className="session-card" onClick={() => setViewSession(s)} style={{cursor: 'pointer', transition: 'transform 0.1s'}} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <div className="session-info"><div className="session-label">{s.dayLabel}</div><div className="session-date">{new Date(s.date).toLocaleDateString('pl-PL')}</div></div>
                    <div className="session-stats"><div className="s-stat"><div className="s-val">{s.totalSets}</div><div className="s-lbl">Serie</div></div><div className="s-stat"><div className="s-val">{s.totalVol > 9999 ? Math.round(s.totalVol / 1000) + 'k' : s.totalVol}</div><div className="s-lbl">Vol</div></div></div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button className="log-fab" onClick={() => setShowModal(true)}><span>+ Zaloguj trening</span></button>
        </div>
      )}

      {tab === 'plan' && (
        <div className={`plan-wrap${panelOpen ? ' panel-open' : ''}`}>
          <div className="plan-view">
            <div className="plan-content">
              <div className="dash-header"><div className="dash-title">AKTYWNY <span>PLAN</span></div></div>
              <div className="week-grid">
                {plan.week.map((d, i) => <DayBlock key={i} dayData={d} dayIdx={i} onFeedback={handleFB} onModifyPlan={handleModifyPlan} />)}
              </div>
            </div>
          </div>
          {panelOpen && <CorrectionPanel plan={plan} onUpdatePlan={p => { setPlan(prev => { const np = p(prev); savePlan(np); return np; }); }} onClose={() => setPanelOpen(false)} />}
          <button className="ai-fab" onClick={() => setPanelOpen(!panelOpen)}><span>AI Korekta</span></button>
        </div>
      )}

      {tab === 'profile' && (
        <div className="progress-shell">
          <div className="progress-content">
            <div className="section-title">TWÓJ PROFIL</div>
            <div className="ex-card" style={{ marginBottom: '20px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Zalogowany jako:</div>
              <div style={{ color: 'var(--neon)', fontWeight: 'bold', fontSize: '1.2rem' }}>{userEmail}</div>
            </div>

            <div className="section-title">CEL I PARAMETRY PLANU</div>
            <div className="ex-card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--neon)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{clean(plan.profile.goal)}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '8px' }}>Doświadczenie: {clean(plan.profile.experience)} | Sprzęt: {clean(plan.profile.equipment)}</div>
            </div>

            <div className="section-title">PARAMETRY FIZYCZNE</div>
            <form onSubmit={handleSaveParams} className="ex-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Waga (kg)</label>
                  <input type="number" value={userParams.weight} onChange={e => setUserParams({...userParams, weight: e.target.value})} style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Wzrost (cm)</label>
                  <input type="number" value={userParams.height} onChange={e => setUserParams({...userParams, height: e.target.value})} style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Wiek</label>
                <input type="number" value={userParams.age} onChange={e => setUserParams({...userParams, age: e.target.value})} style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} />
              </div>
              <button type="submit" className="btn-accept" style={{ marginTop: '10px', width: '100%' }}>Zapisz parametry</button>
            </form>

            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-ghost" onClick={() => { if(window.confirm('To usunie bieżący plan i historię z Twojego konta. Kontynuować?')) { clearAll(); onNewPlan(); } }}>Zrestartuj plan (Nowy Wywiad)</button>
              <button className="btn-ghost" onClick={handleGenerateFakeData} style={{ borderColor: 'var(--neon)', color: 'var(--neon)', opacity: 0.7 }}>🛠 Wygeneruj 8 tyg. historii (Test)</button>
            </div>
          </div>
        </div>
      )}

      {showModal && <SessionLogModal plan={plan} sessions={sessions} onSave={handleSaveSession} onClose={() => setShowModal(false)} />}
      
      {viewSession && <SessionDetailModal session={viewSession} onClose={() => setViewSession(null)} />}
      
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}