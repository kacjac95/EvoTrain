import React, { useState, useEffect, useRef, useMemo } from 'react';
import { callAI } from '../utils/helpers';
import { EXERCISES } from '../config/data';

const AI_SUGS = ['Dodaj więcej ćwiczeń na klatkę','Zmniejsz objętość treningu','Zwiększ liczbę serii','Dodaj izolację na biceps','Więcej ćwiczeń core'];

export function CorrectionPanel({ plan, onUpdatePlan, onClose }) {
  const [msgs, setMsgs] = useState([{from: 'ai', text: 'Witaj! 👋 Co chcesz zmienić w planie? Mogę zamieniać ćwiczenia, dostosowywać serie/powtórzenia lub odpowiedzieć na pytania.', id: 0}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => { ref.current?.scrollIntoView({behavior: 'smooth'}); }, [msgs, loading]);

  const planCtx = useMemo(() => ({
    profile: plan.profile,
    week: plan.week.map(d => ({day: d.day, type: d.type, label: d.label, exercises: d.exercises?.map(e => ({id: e.id, name: e.name, cat: e.cat, sets: e.sets, reps: e.reps, rest: e.rest}))}))
  }), [plan]);

  const applyChanges = (week, changes) => {
    let w = week.map(d => ({...d, exercises: d.exercises?.map(e => ({...e, aiUpdated: false}))}));
    for(const ch of changes) {
      const d = w[ch.dayIndex]; 
      if(!d?.exercises) continue;
      if(ch.type === 'update_sets') w[ch.dayIndex] = {...d, exercises: d.exercises.map((ex, i) => i === ch.exIndex ? {...ex, sets: ch.sets ?? ex.sets, reps: ch.reps ?? ex.reps, rest: ch.rest ?? ex.rest, aiUpdated: true} : ex)};
      if(ch.type === 'swap_exercise') {
        const ne = EXERCISES.find(e => e.id === ch.newExId); 
        if(!ne) continue;
        const oe = d.exercises[ch.exIndex];
        w[ch.dayIndex] = {...d, exercises: d.exercises.map((ex, i) => i === ch.exIndex ? {...ne, sets: oe?.sets || 3, reps: oe?.reps || '8-12', rest: oe?.rest || '90s', feedback: null, suggestion: null, aiUpdated: true} : ex)};
      }
    }
    return w;
  };

  const send = async (txt) => {
    const msg = (txt || input).trim(); 
    if(!msg || loading) return;
    setInput('');
    const um = {from: 'user', text: msg, id: Date.now()};
    const hist = [...msgs, um]; 
    setMsgs(hist); 
    setLoading(true);
    try {
      const raw = await callAI(hist, planCtx);
      let text = raw, changes = [], descs = [];
      try {
        const p = JSON.parse(raw);
        if(p.message) { text = p.message; changes = p.changes || []; descs = changes.map(c => c.description).filter(Boolean); }
      } catch {}
      setMsgs(prev => [...prev, {from: 'ai', text, id: Date.now() + 1, descs}]);
      if(changes.length) onUpdatePlan(prev => ({...prev, week: applyChanges(prev.week, changes)}));
    } catch {
      setMsgs(prev => [...prev, {from: 'ai', text: 'Błąd połączenia z AI. Spróbuj ponownie.', id: Date.now() + 1, descs: []}]);
    }
    setLoading(false);
  };

  return (
    <div className="corr-panel">
      <div className="corr-panel-header">
        <div>
          <div className="corr-title-main">✦ KORYGUJ PLAN</div>
          <div className="corr-title-sub">EvoTrain AI · aktywny</div>
        </div>
        <button className="corr-close" onClick={onClose}>✕</button>
      </div>
      <div className="corr-messages">
        {msgs.map(m => (
          <div key={m.id} className={`corr-msg ${m.from}`}>
            <div className={`corr-avatar ${m.from}`}>{m.from === 'ai' ? 'ET' : 'TY'}</div>
            <div className={`corr-bubble ${m.from}`}>
              <div>{m.text}</div>
              {m.descs && m.descs.length > 0 && (
                <div className="change-badge">
                  <span className="change-badge-title">⟳ Zmiany:</span>
                  {m.descs.map((d, i) => <div key={i}>· {d}</div>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="corr-msg ai">
            <div className="corr-avatar ai">ET</div>
            <div className="corr-bubble ai">
              <div className="corr-typing">
                <div className="corr-typing-dot"></div><div className="corr-typing-dot"></div><div className="corr-typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={ref}></div>
      </div>
      <div className="corr-sugs">
        {AI_SUGS.map(s => <button key={s} className="corr-sug-btn" onClick={() => send(s)} disabled={loading}>{s}</button>)}
      </div>
      <div className="corr-input-row">
        <input className="corr-input" placeholder="Wpisz co chcesz zmienić..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} disabled={loading} />
        <button className="corr-send" onClick={() => send()} disabled={!input.trim() || loading}>{loading ? '...' : 'WYŚLIJ'}</button>
      </div>
    </div>
  );
}

export function SessionLogModal({ plan, onSave, onClose }) {
  const trainingDays = plan.week.filter(d => d.type === 'training');
  const [selDay, setSelDay] = useState(null);
  const [exSets, setExSets] = useState({});

  useEffect(() => {
    if(selDay !== null && trainingDays[selDay]) {
      const init = {};
      trainingDays[selDay].exercises.forEach(ex => {
        init[ex.id] = Array(ex.sets).fill(null).map(() => ({reps: '', weight: ''}));
      });
      setExSets(init);
    }
  }, [selDay]);

  const updSet = (exId, si, field, val) => setExSets(prev => ({...prev, [exId]: prev[exId].map((s, i) => i === si ? {...s, [field]: val} : s)}));
  const addSet = exId => setExSets(prev => ({...prev, [exId]: [...(prev[exId] || []), {reps: '', weight: ''}]}));

  const canSave = selDay !== null && Object.values(exSets).some(sets => sets.some(s => s.reps));

  const handleSave = () => {
    if(!canSave) return;
    const day = trainingDays[selDay];
    const exercises = day.exercises.map(ex => ({
      id: ex.id, name: ex.name,
      sets: (exSets[ex.id] || []).filter(s => s.reps).map(s => ({reps: Number(s.reps) || 0, weight: Number(s.weight) || 0}))
    })).filter(e => e.sets.length);
    const totalSets = exercises.reduce((t, e) => t + e.sets.length, 0);
    const totalVol = exercises.reduce((t, e) => t + e.sets.reduce((s, set) => s + (set.reps || 0) * Math.max(set.weight || 1, 1), 0), 0);
    onSave({dayLabel: day.label, exercises, totalSets, totalVol: Math.round(totalVol)});
  };

  const selectedDay = selDay !== null ? trainingDays[selDay] : null;

  return (
    <div className="modal-overlay" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header">
          <div className="modal-title">ZALOGUJ TRENING</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{fontSize: '.78rem', color: 'var(--muted)', marginBottom: '12px', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '1px'}}>
            WYBIERZ DZIEŃ TRENINGOWY
          </div>
          <div className="day-picker">
            {trainingDays.map((d, i) => (
              <button key={i} className={`day-pick-btn${selDay === i ? ' active' : ''}`} onClick={() => setSelDay(i)}>{d.label}</button>
            ))}
          </div>
          {selectedDay && (
            <div>
              <hr className="modal-divider" />
              <div style={{fontSize: '.78rem', color: 'var(--muted)', marginBottom: '14px', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '1px'}}>
                ĆWICZENIA · SERIE × POWTÓRZENIA × CIĘŻAR
              </div>
              {selectedDay.exercises.map(ex => (
                <div key={ex.id} className="ex-log-block">
                  <div className="ex-log-header">
                    <div className="ex-log-name">{ex.name}</div>
                    <div className="ex-log-cat">{ex.cat} · plan: {ex.sets}×{ex.reps}</div>
                  </div>
                  <div className="set-input-grid">
                    {(exSets[ex.id] || []).map((set, si) => (
                      <div key={si} className="set-input-row">
                        <div className="set-num-label">{si + 1}</div>
                        <input className="num-input" type="number" min="0" placeholder="powt." value={set.reps} onChange={e => updSet(ex.id, si, 'reps', e.target.value)} />
                        <div className="input-sep">×</div>
                        <input className="num-input" type="number" min="0" step="0.5" placeholder="kg" value={set.weight} onChange={e => updSet(ex.id, si, 'weight', e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <button className="add-set-btn" onClick={() => addSet(ex.id)}>+ Dodaj serię</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="save-session-btn" onClick={handleSave} disabled={!canSave}>✓ ZAPISZ SESJĘ</button>
        </div>
      </div>
    </div>
  );
}