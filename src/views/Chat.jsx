import React, { useState, useRef, useCallback, useEffect } from 'react';
import { QUESTIONS } from '../config/data';
import { generatePlan } from '../utils/helpers';
import { Logo } from '../components/Common';

export default function Chat({ onComplete }) {
  const [msgs, setMsgs] = useState([]);
  const [qi, setQi] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [opts, setOpts] = useState([]);
  const ref = useRef(null);

  const pushMsg = (from, text) => setMsgs(prev => [...prev, {from, text, id: Date.now() + Math.random()}]);

  const askNext = useCallback(idx => {
    if(idx >= QUESTIONS.length) { setOpts([]); setTyping(false); return; }
    setTyping(true); setOpts([]);
    setTimeout(() => {
      setTyping(false);
      pushMsg('ai', QUESTIONS[idx].text);
      setOpts(QUESTIONS[idx].options);
      setQi(idx);
    }, 800 + Math.random() * 400);
  }, []);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      pushMsg('ai', '⚡ Inicjalizacja EvoTrain AI...\nSystem gotowy.');
      setTimeout(() => askNext(0), 1000);
    }, 400);
    return () => clearTimeout(initTimer);
  }, [askNext]);

  useEffect(() => { ref.current?.scrollIntoView({behavior: 'smooth'}); }, [msgs, typing, opts]);

  const handleAnswer = ans => {
    pushMsg('user', ans);
    const q = QUESTIONS[qi];
    const next = {...answers, [q.key]: ans};
    setAnswers(next); 
    setOpts([]);
    if(qi + 1 >= QUESTIONS.length) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushMsg('ai', '🧬 Profil skompletowany. Generuję spersonalizowany plan...');
        setTimeout(() => onComplete(generatePlan(next)), 600);
      }, 600);
    } else {
      askNext(qi + 1);
    }
  };

  const handleSend = () => {
    if(!input.trim() || typing || qi < 0 || qi >= QUESTIONS.length) return;
    handleAnswer(input.trim());
    setInput('');
  };

  const rt = t => t.split('\n').map((l, i, a) => <span key={i}>{l.replace(/\*\*(.*?)\*\*/g, '$1')}{i < a.length - 1 && <br />}</span>);

  return (
    <div className="app-shell chat-view" style={{minHeight: '100vh'}}>
      <div className="top-bar">
        <Logo />
        <div className="phase-indicator"><div className="phase-dot"></div>{qi >= 0 ? `WYWIAD ${qi + 1}/${QUESTIONS.length}` : 'INICJALIZACJA'}</div>
      </div>
      <div className="chat-container">
        {msgs.map(m => (
          <div key={m.id} className={`msg-row ${m.from}`}>
            <div className={`avatar ${m.from}`}>{m.from === 'ai' ? 'ET' : 'TY'}</div>
            <div className={`bubble ${m.from}`}>{rt(m.text)}</div>
          </div>
        ))}
        {typing && (
          <div className="msg-row ai">
            <div className="avatar ai">ET</div>
            <div className="bubble ai">
              <div className="typing-indicator">
                <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={ref}></div>
      </div>
      <div className="input-bar">
        <div className="input-inner">
          {opts.length > 0 && <div className="quick-btns">{opts.map(o => <button key={o} className="quick-btn" onClick={() => handleAnswer(o)}>{o}</button>)}</div>}
          <div className="input-row">
            <input className="text-input" placeholder={opts.length ? 'Wybierz lub wpisz własną...' : 'Wpisz odpowiedź...'} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={typing || qi < 0 || qi >= QUESTIONS.length} />
            <button className="send-btn" onClick={handleSend} disabled={!input.trim() || typing || qi < 0 || qi >= QUESTIONS.length}>{qi === QUESTIONS.length - 1 ? 'GENERUJ PLAN →' : 'WYŚLIJ →'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}