import { EXERCISES } from '../config/data';

const SK = { PLAN:'evotrain_plan_v2', SESSIONS:'evotrain_sessions_v2' };

export const loadPlan = () => { try { return JSON.parse(localStorage.getItem(SK.PLAN)); } catch { return null; } };
export const savePlan = p => { localStorage.setItem(SK.PLAN, JSON.stringify(p)); };
export const loadSess = () => { try { return JSON.parse(localStorage.getItem(SK.SESSIONS)) || []; } catch { return []; } };
export const saveSess = s => { localStorage.setItem(SK.SESSIONS, JSON.stringify(s)); };
export const clearAll = () => { localStorage.removeItem(SK.PLAN); localStorage.removeItem(SK.SESSIONS); };

export function generatePlan(profile) {
  const days = parseInt(profile.frequency) || 3;
  const isBW = profile.equipment.includes('Tylko masa ciała');
  const isDb = profile.equipment.includes('Hantle');
  const isAdv = profile.experience.includes('Zaawansowany');
  const isBeg = profile.experience.includes('Początkujący');
  const isStr = profile.goal.includes('siły');
  const isBulk = profile.goal.includes('masy');
  const bk = profile.injuries.includes('kręgosłupem');
  const kn = profile.injuries.includes('kolanami');
  const sh = profile.injuries.includes('barkami');

  let pool = EXERCISES.filter(ex => {
    if (bk && ['dl','row','rdl','inv','lrow'].includes(ex.id)) return false;
    if (kn && ['sq','lunge','bulg','gobsq','calf','lgcurl'].includes(ex.id)) return false;
    if (sh && ['ohp','pu_d','pike','facepl','dips','incbp'].includes(ex.id)) return false;
    if (isBW) return ex.equipment.every(e=>['bodyweight','pullup_bar','dip_bar'].includes(e));
    if (isDb) return ex.equipment.every(e=>['dumbbells','bodyweight','pullup_bar','bench'].includes(e));
    return true;
  });
  if (!isAdv||isBeg) pool = pool.filter(e=>e.diff!=='advanced');

  const push = pool.filter(e=>e.cat==='Push'), pull = pool.filter(e=>e.cat==='Pull'),
        legs = pool.filter(e=>e.cat==='Legs'), core = pool.filter(e=>e.cat==='Core');
  const pick = (a,n)=>[...a].sort(()=>Math.random()-.5).slice(0,Math.min(n,a.length));
  const sets = isStr ? {sets:isAdv?5:4,reps:'4-6',rest:'180s'} : isBulk ? {sets:4,reps:'8-12',rest:'90s'} : {sets:3,reps:'12-20',rest:'60s'};
  const mk = list => list.map(ex=>({...ex,...sets,feedback:null,suggestion:null,aiUpdated:false}));

  let td=[];
  if(days<=2){ td=[{label:'FULL BODY A',exercises:mk([...pick(push,2),...pick(pull,2),...pick(legs,2),...pick(core,1)])},{label:'FULL BODY B',exercises:mk([...pick(push,2),...pick(pull,2),...pick(legs,2),...pick(core,1)])}]; }
  else if(days===3){ td=[{label:'PUSH',exercises:mk([...pick(push,3),...pick(core,1)])},{label:'PULL',exercises:mk([...pick(pull,3),...pick(core,1)])},{label:'LEGS',exercises:mk([...pick(legs,3),...pick(core,1)])}]; }
  else if(days===4){ td=[{label:'KLATKA & TRICEPS',exercises:mk(pick(push,4))},{label:'PLECY & BICEPS',exercises:mk(pick(pull,4))},{label:'NOGI',exercises:mk([...pick(legs,3),...pick(core,1)])},{label:'BARKI & CORE',exercises:mk([...pick(push.filter(e=>e.muscles.includes('Bark')||e.muscles.includes('bark')),2),...pick(core,2)])}]; }
  else { td=[{label:'PUSH A',exercises:mk([...pick(push,4),...pick(core,1)])},{label:'PULL A',exercises:mk([...pick(pull,4),...pick(core,1)])},{label:'NOGI',exercises:mk(pick(legs,4))},{label:'PUSH B',exercises:mk(pick(push,3))},{label:'PULL B & CORE',exercises:mk([...pick(pull,3),...pick(core,2)])}]; }
  td=td.map(d=>({...d,exercises:d.exercises.length?d.exercises:mk([...pick(push,2),...pick(pull,2)])}));

  const dn=['PONIEDZIAŁEK','WTOREK','ŚRODA','CZWARTEK','PIĄTEK','SOBOTA','NIEDZIELA'];
  let ti=0;
  const week = dn.map(day=>ti<td.length?{day,type:'training',...td[ti++]}:{day,type:'rest'});
  return {week,profile,createdAt:Date.now()};
}

export function adaptEx(ex, f) {
  if(f==='easy'){const[a,b]=ex.reps.split('-').map(Number);return`📈 Zwiększ do ${a+2}-${b+2} powt. lub dodaj serię (${Math.min(ex.sets+1,5)}×). Ciężar: +5-10%.`;}
  if(f==='hard'){const[a,b]=ex.reps.split('-').map(Number);return`📉 Zmniejsz do ${Math.max(a-2,1)}-${Math.max(b-2,2)} powt. lub zredukuj ciężar o ~10%.`;}
  return'✅ Optymalne tempo. Utrzymaj 1-2 tygodnie.';
}

export function calcStreak(sessions) {
  if(!sessions.length) return 0;
  const dates=new Set(sessions.map(s=>new Date(s.date).toDateString()));
  let streak=0; const today=new Date();
  for(let i=0;i<365;i++){
    const d=new Date(today); d.setDate(today.getDate()-i);
    if(dates.has(d.toDateString())) streak++;
    else if(i>0) break;
  }
  return streak;
}

export function getWeeklyData(sessions) {
  const result=[];
  const now=new Date();
  for(let i=7;i>=0;i--){
    const wStart=new Date(now); wStart.setDate(now.getDate()-(now.getDay()||7)+1-i*7); wStart.setHours(0,0,0,0);
    const wEnd=new Date(wStart); wEnd.setDate(wStart.getDate()+7);
    const wSess=sessions.filter(s=>{const d=new Date(s.date);return d>=wStart&&d<wEnd;});
    const vol=wSess.reduce((t,s)=>t+s.exercises.reduce((et,ex)=>et+ex.sets.reduce((st,set)=>st+(set.reps||0)*Math.max(set.weight||1,1),0),0),0);
    const lbl=wStart.toLocaleDateString('pl-PL',{day:'numeric',month:'short'});
    result.push({label:lbl,volume:Math.round(vol),count:wSess.length});
  }
  return result;
}

export function getExProgress(sessions, exId) {
  return sessions
    .filter(s=>s.exercises.some(e=>e.id===exId))
    .map(s=>{
      const ex=s.exercises.find(e=>e.id===exId);
      const mw=Math.max(...ex.sets.map(set=>Number(set.weight)||0));
      const tr=ex.sets.reduce((sum,set)=>sum+(Number(set.reps)||0),0);
      return{date:new Date(s.date).toLocaleDateString('pl-PL',{day:'numeric',month:'short'}),maxWeight:mw,totalReps:tr};
    }).reverse();
}

export function thisWeekCount(sessions) {
  const now=new Date(); const wStart=new Date(now); wStart.setDate(now.getDate()-(now.getDay()||7)+1); wStart.setHours(0,0,0,0);
  return sessions.filter(s=>new Date(s.date)>=wStart).length;
}

export async function callAI(history, planCtx) {
  const systemText = `Jesteś AI trenerem personalnym w aplikacji EvoTrain. Pomagasz korygować plany treningowe.

AKTUALNY PLAN:
${JSON.stringify(planCtx, null, 2)}

Gdy MODYFIKUJESZ plan — odpowiedz TYLKO prawidłowym JSON (bez żadnego tekstu poza nim):
{"message":"odpowiedź","changes":[{"type":"update_sets","dayIndex":0,"exIndex":0,"sets":4,"reps":"8-10","rest":"90s","description":"opis"},{"type":"swap_exercise","dayIndex":1,"exIndex":2,"newExId":"dl","description":"opis"}]}

Dostępne typy: "update_sets", "swap_exercise".
ID ćwiczeń: sq,bp,dl,ohp,row,pu,pu_d,chin,pull,lunge,dbs,dbr,rdl,gobsq,pike,inv,bulg,dips,core,abrv,cgrow,facepl,calf,lrow,incbp,lgcurl

Gdy ROZMAWIASZ bez zmian — odpowiedz zwykłym tekstem po polsku. Krótko, maks 3 zdania.`;

  // W wersji v1, gdzie systemInstruction nie jest rozpoznawane, 
  // wstrzykujemy instrukcję jako pierwszą wiadomość użytkownika.
  const contents = [
    {
      role: 'user',
      parts: [{ text: `INSTRUKCJA I KONTEKST: ${systemText}` }]
    },
    {
      role: 'model',
      parts: [{ text: "Zrozumiałem instrukcje. Będę odpowiadać zgodnie z Twoimi wymaganiami (JSON dla zmian, tekst dla rozmowy). W czym mogę pomóc?" }]
    },
    // Mapujemy resztę historii użytkownika
    ...history.map(m => ({
      role: m.from === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }))
  ];

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents // Usunięto problematyczne pole systemInstruction
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Błąd Gemini API:', errorData);
      throw new Error(`Błąd API: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    return "AI nie zwróciło żadnej treści.";

  } catch (err) {
    console.error('Błąd połączenia z Gemini:', err);
    return "Wystąpił błąd podczas próby kontaktu z trenerem AI.";
  }
}