import React, { useState, useEffect, useMemo } from 'react';
import { adaptEx } from '../utils/helpers';
import MuscleMap from './MuscleMap';
import { EXERCISES } from '../config/data';

export function Logo({ onClick }) {
  return (
    <div className="logo" onClick={onClick}>
      <div className="logo-mark">
        <svg viewBox="0 0 18 18" fill="none">
          <path d="M3 9h3M12 9h3M6 6.5v5M12 6.5v5" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="9" r="1.5" fill="#000" />
        </svg>
      </div>
      <div>
        <div className="logo-text"><span className="evo">EVO</span><span className="train">TRAIN</span></div>
        <span className="logo-sub">AI Coach</span>
      </div>
    </div>
  );
}

export function TransitionScreen({ onDone, labels }) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('');
  
  const lbs = useMemo(() => labels || [
    [0, 'Analizuję profil...'],
    [30, 'Dopasowuję ćwiczenia...'],
    [60, 'Kalibrowuję parametry...'],
    [85, 'Generuję plan tygodniowy...']
  ], [labels]);
  
  useEffect(() => {
    let p = 0; 
    const iv = setInterval(() => {
      p += 2; 
      setProgress(p);
      const l = lbs.filter(([t]) => t <= p).pop();
      if(l) setLabel(l[1]);
      if(p >= 100) { clearInterval(iv); setTimeout(onDone, 300); }
    }, 28);
    return () => clearInterval(iv);
  }, [onDone, lbs]);

  return (
    <div className="transition-overlay">
      <div className="transition-logo">EVOTRAIN</div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="transition-label">{label}</div>
    </div>
  );
}

export function AcceptTransition({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="accept-overlay">
      <div className="accept-check">✓</div>
      <div className="accept-title">PLAN ZAPISANY!</div>
      <div className="accept-sub">Przechodzimy do Twojego dashboardu...</div>
    </div>
  );
}

// NOWY KOMPONENT: Formularz dodawania / edycji ćwiczenia
export function ExerciseModal({ isOpen, onClose, onSave, initialData }) {
  const [exId, setExId] = useState(initialData?.id || EXERCISES[0].id);
  const [sets, setSets] = useState(initialData?.sets || 3);
  const [reps, setReps] = useState(initialData?.reps || '8-12');
  const [rest, setRest] = useState(initialData?.rest || '90s');

  if (!isOpen) return null;

  const handleSave = () => {
    const baseEx = EXERCISES.find(e => e.id === exId);
    onSave({
      ...baseEx,
      sets: Number(sets),
      reps,
      rest,
      aiUpdated: true // Flaga, żeby wyróżnić ręcznie dodane/zmienione ćwiczenie
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#121212', padding: '25px', borderRadius: '16px',
        width: '100%', maxWidth: '400px', border: '1px solid #333', color: '#fff',
        display: 'flex', flexDirection: 'column', gap: '15px'
      }}>
        <h3 style={{margin: 0, fontSize: '1.2rem'}}>{initialData ? 'Edytuj ćwiczenie' : 'Dodaj ćwiczenie'}</h3>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
          <label style={{fontSize: '0.85rem', color: '#aaa'}}>Ćwiczenie z bazy:</label>
          <select 
            value={exId} 
            onChange={e => setExId(e.target.value)}
            style={{padding: '10px', borderRadius: '8px', background: '#222', color: '#fff', border: '1px solid #444'}}
          >
            {EXERCISES.map(e => <option key={e.id} value={e.id}>{e.name} ({e.muscles})</option>)}
          </select>
        </div>

        <div style={{display: 'flex', gap: '10px'}}>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <label style={{fontSize: '0.85rem', color: '#aaa'}}>Serie</label>
            <input type="number" value={sets} onChange={e => setSets(e.target.value)} style={{padding: '10px', borderRadius: '8px', background: '#222', color: '#fff', border: '1px solid #444', width: '100%'}} />
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <label style={{fontSize: '0.85rem', color: '#aaa'}}>Powtórzenia</label>
            <input type="text" value={reps} onChange={e => setReps(e.target.value)} style={{padding: '10px', borderRadius: '8px', background: '#222', color: '#fff', border: '1px solid #444', width: '100%'}} />
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <label style={{fontSize: '0.85rem', color: '#aaa'}}>Przerwa</label>
            <input type="text" value={rest} onChange={e => setRest(e.target.value)} style={{padding: '10px', borderRadius: '8px', background: '#222', color: '#fff', border: '1px solid #444', width: '100%'}} />
          </div>
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
          <button onClick={onClose} style={{flex: 1, padding: '12px', borderRadius: '8px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer'}}>Anuluj</button>
          <button onClick={handleSave} style={{flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--neon)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}

export function ExerciseCard({ ex, dayIdx, exIdx, onFeedback, readOnly, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sug, setSug] = useState(null);

  const handle = f => {
    const s = adaptEx(ex, f);
    setFeedback(f);
    setSug(s);
    if(onFeedback) onFeedback(dayIdx, exIdx, f, s);
  };

  return (
    <div className={`ex-card${ex.aiUpdated ? ' ai-updated' : ''}`} style={{position: 'relative'}}>
      
      {/* Przyciski edycji i usuwania */}
      {!readOnly && onEdit && onDelete && (
        <div style={{position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px'}}>
          <button onClick={onEdit} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7}}>✏️</button>
          <button onClick={onDelete} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7}}>🗑️</button>
        </div>
      )}

      <div className="ex-name" style={{paddingRight: (!readOnly && onEdit) ? '50px' : '0'}}>{ex.name}</div>
      <div className="ex-muscles">{ex.muscles}</div>
      <div className="ex-tags">
        <span className={`tag ${ex.cat.toLowerCase()}`}>{ex.cat}</span>
        <span className="tag diff">{ex.diff}</span>
      </div>
      <div className="ex-sets">
        <div className="set-box"><div className="set-val">{ex.sets}</div><div className="set-label">Serie</div></div>
        <div className="set-box"><div className="set-val" style={{fontSize: '1rem'}}>{ex.reps}</div><div className="set-label">Powt.</div></div>
        <div className="set-box"><div className="set-val" style={{fontSize: '.85rem'}}>{ex.rest}</div><div className="set-label">Przerwa</div></div>
      </div>
      {!readOnly && (
        <div className="progress-section">
          <button className={`progress-toggle${feedback ? ' done' : ''}`} onClick={() => setOpen(!open)}>
            <span>{feedback ? '✓ Oceniono' : '⟳ Postęp'}</span>
            <span>{open ? '▲' : '▼'}</span>
          </button>
          {open && (
            <div className="progress-panel">
              <div className="feel-btns">
                <button className={`feel-btn easy${feedback === 'easy' ? ' active' : ''}`} onClick={() => handle('easy')}>😤 Łatwy</button>
                <button className={`feel-btn ok${feedback === 'ok' ? ' active' : ''}`} onClick={() => handle('ok')}>👌 OK</button>
                <button className={`feel-btn hard${feedback === 'hard' ? ' active' : ''}`} onClick={() => handle('hard')}>😰 Ciężki</button>
              </div>
              {sug && <div className="suggestion-box">{sug}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DayBlock({ dayData, dayIdx, onFeedback, onModifyPlan, readOnly }) {
  const [modalState, setModalState] = useState({ isOpen: false, exIdx: null, data: null });

  const handleSaveModal = (newData) => {
    if (modalState.exIdx !== null) {
      onModifyPlan(dayIdx, 'edit', modalState.exIdx, newData);
    } else {
      onModifyPlan(dayIdx, 'add', null, newData);
    }
    setModalState({ isOpen: false, exIdx: null, data: null });
  };

  if(dayData.type === 'rest') return (
    <div className="day-block" style={{animationDelay: `${dayIdx * 0.05}s`}}>
      <div className="day-header">
        <div className="day-title">{dayData.day}</div>
        <div className="day-badge">Odpoczynek</div>
      </div>
      <div className="rest-card">
        <div className="rest-icon">🌙</div>
        <div className="rest-text">Regeneracja, stretching lub spacer</div>
      </div>
    </div>
  );

  return (
    <div className="day-block" style={{animationDelay: `${dayIdx * 0.05}s`}}>
      <div className="day-header">
        <div className="day-title">{`${dayData.day} — ${dayData.label}`}</div>
        <div className="day-badge">{`${dayData.exercises.length} ćwiczeń`}</div>
      </div>
      
      {dayData.exercises && dayData.exercises.length > 0 && (
        <MuscleMap dayExercises={dayData.exercises} />
      )}

      <div className="exercises-grid">
        {dayData.exercises.map((ex, ei) => (
          <ExerciseCard 
            key={ex.id + ei + ex.sets + ex.reps} 
            ex={ex} 
            dayIdx={dayIdx} 
            exIdx={ei} 
            onFeedback={onFeedback} 
            readOnly={readOnly}
            onEdit={() => setModalState({ isOpen: true, exIdx: ei, data: ex })}
            onDelete={() => { if(window.confirm('Usunąć to ćwiczenie?')) onModifyPlan(dayIdx, 'delete', ei) }}
          />
        ))}
      </div>

      {!readOnly && onModifyPlan && (
        <button 
          className="btn-ghost" 
          style={{width: '100%', marginTop: '15px', borderStyle: 'dashed', opacity: 0.8}} 
          onClick={() => setModalState({ isOpen: true, exIdx: null, data: null })}
        >
          + Dodaj ćwiczenie
        </button>
      )}

      <ExerciseModal
        isOpen={modalState.isOpen}
        initialData={modalState.data}
        onClose={() => setModalState({ isOpen: false, exIdx: null, data: null })}
        onSave={handleSaveModal}
      />
    </div>
  );
}