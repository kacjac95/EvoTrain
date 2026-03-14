import React, { useState, useEffect, useMemo } from 'react';
import { adaptEx } from '../utils/helpers';

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
  
  // ZMIANA TUTAJ: Używamy useMemo, aby tablica nie tworzyła się na nowo przy każdym renderze
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

export function ExerciseCard({ ex, dayIdx, exIdx, onFeedback, readOnly }) {
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
    <div className={`ex-card${ex.aiUpdated ? ' ai-updated' : ''}`}>
      <div className="ex-name">{ex.name}</div>
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

export function DayBlock({ dayData, dayIdx, onFeedback, readOnly }) {
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
      <div className="exercises-grid">
        {dayData.exercises.map((ex, ei) => (
          <ExerciseCard key={ex.id + ei + ex.sets + ex.reps} ex={ex} dayIdx={dayIdx} exIdx={ei} onFeedback={onFeedback} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}