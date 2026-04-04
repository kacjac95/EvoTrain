import { EXERCISES } from '../config/data';
import { supabase } from '../config/supabase';

const SK = { PLAN:'evotrain_plan_v2', SESSIONS:'evotrain_sessions_v2' };

export const loadPlan = () => { try { return JSON.parse(localStorage.getItem(SK.PLAN)); } catch { return null; } };
export const loadSess = () => { try { return JSON.parse(localStorage.getItem(SK.SESSIONS)) || []; } catch { return []; } };

export const savePlan = async p => { 
  localStorage.setItem(SK.PLAN, JSON.stringify(p)); 
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('user_data').update({ plan: p }).eq('user_id', user.id);
};

export const saveSess = async s => { 
  localStorage.setItem(SK.SESSIONS, JSON.stringify(s)); 
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('user_data').update({ sessions: s }).eq('user_id', user.id);
};

export const saveParams = async params => {
  localStorage.setItem('evotrain_user_params', JSON.stringify(params));
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('user_data').update({ params }).eq('user_id', user.id);
};

export const clearAll = async () => { 
  localStorage.removeItem(SK.PLAN); 
  localStorage.removeItem(SK.SESSIONS); 
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('user_data').update({ plan: null, sessions: [] }).eq('user_id', user.id);
};

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

  const age = parseInt(profile.age) || 30;
  const weight = parseFloat(profile.weight) || 70;
  const height = parseFloat(profile.height) || 175;
  const gender = profile.gender || '';
  
  const bmi = height > 0 ? (weight / Math.pow(height / 100, 2)) : 22;
  const isOverweight = bmi > 28;
  const isOlder = age >= 50;
  const isFemale = gender.includes('Kobieta');

  let pool = EXERCISES.filter(ex => {
    if (bk && ['dl','row','rdl','inv','lrow'].includes(ex.id)) return false;
    if (kn && ['sq','lunge','bulg','gobsq','calf','lgcurl'].includes(ex.id)) return false;
    if (sh && ['ohp','pu_d','pike','facepl','dips','incbp'].includes(ex.id)) return false;
    
    if (isOverweight && isBW && isBeg && ['pull', 'chin', 'dips'].includes(ex.id)) return false;

    if (isBW) return ex.equipment.every(e=>['bodyweight','pullup_bar','dip_bar'].includes(e));
    if (isDb) return ex.equipment.every(e=>['dumbbells','bodyweight','pullup_bar','bench'].includes(e));
    
    if (!isAdv && ex.diff === 'advanced') return false; 
    if (isOlder && ex.diff === 'advanced') return false; 
    return true;
  });

  const scoreExercise = (ex) => {
    let score = 0;
    if (isBeg && ex.diff === 'beginner') score += 10;
    if (!isBeg && !isAdv && ex.diff === 'intermediate') score += 10;
    if (isAdv && ex.diff === 'advanced') score += 10;
    if (isAdv && ex.diff === 'intermediate') score += 5;

    if (isStr && ex.equipment.includes('barbell')) score += 8; 
    if (isBulk && ex.equipment.includes('dumbbells')) score += 5; 
    if (isBulk && ex.equipment.includes('cable')) score += 6;

    if (isOlder && ex.equipment.includes('cable')) score += 5;
    if (isOverweight && ex.equipment.includes('cable')) score += 3;

    if (isFemale && (ex.muscleIds?.includes('gluteal') || ex.muscleIds?.includes('hamstring'))) score += 4;
    return score;
  };

  const push = pool.filter(e=>e.cat==='Push'), pull = pool.filter(e=>e.cat==='Pull'),
        legs = pool.filter(e=>e.cat==='Legs'), core = pool.filter(e=>e.cat==='Core');
        
  const pick = (a, n, offset = 0) => {
    if(!a.length) return [];
    const sorted = [...a].sort((x, y) => {
      const sX = scoreExercise(x);
      const sY = scoreExercise(y);
      if (sX !== sY) return sY - sX; 
      return x.id.localeCompare(y.id); 
    });
    const res = [];
    for(let i=0; i<n; i++){
      res.push(sorted[(offset + i) % sorted.length]);
    }
    return Array.from(new Set(res)); 
  };
  
  // --- NAUKOWE MODYFIKATORY OBJĘTOŚCI (METAANALIZY SCHOENFELDA) ---
  const targetSetsPerMuscle = isBeg ? 10 : (isAdv ? 18 : 14);
  
  let baseSets = isStr ? (isAdv ? 5 : 4) : (isBulk ? 4 : 3);
  if (isOlder && baseSets > 3) baseSets -= 1; 

  let baseReps = isStr ? '4-6' : isBulk ? '8-12' : '12-20';
  if (isFemale && isBulk) baseReps = '10-14'; 

  let baseRest = isStr ? 180 : (isBulk ? 90 : 60);
  if (isOlder) baseRest += 30; 
  if (isOverweight) baseRest += 30; 

  const setsConfig = { sets: baseSets, reps: baseReps, rest: baseRest + 's' };
  const mk = list => list.map(ex=>({...ex,...setsConfig,feedback:null,suggestion:null,aiUpdated:false}));

  const exPerCat = Math.max(2, Math.ceil(targetSetsPerMuscle / baseSets));

  let td=[];
  if(days<=2){ 
    const pFB = Math.ceil(exPerCat / 2);
    td=[
      {label:'FULL BODY A',exercises:mk([...pick(push, pFB, 0),...pick(pull, pFB, 0),...pick(legs, pFB, 0),...pick(core, 1, 0)])},
      {label:'FULL BODY B',exercises:mk([...pick(push, pFB, pFB),...pick(pull, pFB, pFB),...pick(legs, pFB, pFB),...pick(core, 1, 1)])}
    ];
  }
  else if(days===3){ 
    td=[
      {label:'PUSH',exercises:mk([...pick(push, exPerCat, 0),...pick(core, 1, 0)])},
      {label:'PULL',exercises:mk([...pick(pull, exPerCat, 0),...pick(core, 1, 1)])},
      {label:'LEGS',exercises:mk([...pick(legs, exPerCat, 0),...pick(core, 1, 2)])}
    ];
  }
  else if(days===4){ 
    const pA = Math.ceil(exPerCat/2), pB = exPerCat - pA;
    td=[
      {label:'UPPER A (Góra)',exercises:mk([...pick(push, pA, 0),...pick(pull, pA, 0)])},
      {label:'LOWER A (Dół)',exercises:mk([...pick(legs, pA, 0),...pick(core, 1, 0)])},
      {label:'UPPER B (Góra)',exercises:mk([...pick(push, pB, pA),...pick(pull, pB, pA)])},
      {label:'LOWER B (Dół)',exercises:mk([...pick(legs, pB, pA),...pick(core, 1, 1)])}
    ];
  }
  else { 
    const pA = Math.ceil(exPerCat * 0.6), pB = exPerCat - pA;
    td=[
      {label:'PUSH',exercises:mk([...pick(push, pA, 0),...pick(core, 1, 0)])},
      {label:'PULL',exercises:mk([...pick(pull, pA, 0),...pick(core, 1, 1)])},
      {label:'LEGS',exercises:mk([...pick(legs, pA, 0)])},
      {label:'UPPER',exercises:mk([...pick(push, pB, pA),...pick(pull, pB, pA)])},
      {label:'LOWER',exercises:mk([...pick(legs, pB, pA),...pick(core, 1, 2)])}
    ];
  }
  td=td.map(d=>({...d,exercises:d.exercises.length?d.exercises:mk([...pick(push,2),...pick(pull,2)])}));

  const dn=['PONIEDZIAŁEK','WTOREK','ŚRODA','CZWARTEK','PIĄTEK','SOBOTA','NIEDZIELA'];
  let schedule = [0, 1, 2, 3, 4, 5, 6]; 
  if (td.length === 2) schedule = [0, 3]; 
  else if (td.length === 3) schedule = [0, 2, 4]; 
  else if (td.length === 4) schedule = [0, 1, 3, 4]; 
  else if (td.length >= 5) schedule = [0, 1, 3, 4, 5]; 

  let ti = 0;
  const week = dn.map((day, idx) => {
    if (schedule.includes(idx) && ti < td.length) {
      return { day, type: 'training', ...td[ti++] };
    }
    return { day, type: 'rest' };
  });
  
  return {week,profile,createdAt:Date.now()};
}

export async function optimizePlanWithAI(basePlan, profile) {
  const systemText = `Jesteś ekspertem i głównym trenerem sztucznej inteligencji.
Otrzymujesz wstępny szkielet planu treningowego wygenerowany przez algorytm oraz profil fizyczny i preferencje użytkownika.
Twoim zadaniem jest zoptymalizować ten plan (dobór ćwiczeń, parametry serii, powtórzeń, czas przerw), aby idealnie pasował do profilu.

PROFIL UŻYTKOWNIKA:
${JSON.stringify(profile, null, 2)}

WSTĘPNY PLAN (struktura do modyfikacji):
${JSON.stringify(basePlan.week, null, 2)}

INSTRUKCJE:
1. Przeanalizuj sprzęt, doświadczenie, płeć, wagę, kontuzje i cel.
2. Zoptymalizuj ćwiczenia, zakresy powtórzeń i czas przerw w podanym planie. Możesz edytować właściwości "sets", "reps" i "rest" w każdym ćwiczeniu.
3. Musisz zwrócić TYLKO I WYŁĄCZNIE czysty tekst w formacie JSON reprezentujący zaktualizowaną tablicę "week". Bez żadnych znaczników markdown (nie używaj \`\`\`json), bez wstępów, bez podsumowań. Oczekiwany format to dokładnie tablica obiektów jak w otrzymanym WSTĘPNYM PLANIE.`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: systemText }] }]
      })
    });

    if (!res.ok) throw new Error(`Błąd API optymalizacji: ${res.status}`);

    const data = await res.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      let aiText = data.candidates[0].content.parts[0].text.trim();
      aiText = aiText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      
      const optimizedWeek = JSON.parse(aiText);
      return { ...basePlan, week: optimizedWeek };
    }
    return basePlan;
  } catch (err) {
    console.error('Błąd podczas optymalizacji planu przez AI (fallback do algorytmu):', err);
    return basePlan; 
  }
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

  const contents = [
    { role: 'user', parts: [{ text: `INSTRUKCJA I KONTEKST: ${systemText}` }] },
    { role: 'model', parts: [{ text: "Zrozumiałem instrukcje. Będę odpowiadać zgodnie z Twoimi wymaganiami (JSON dla zmian, tekst dla rozmowy). W czym mogę pomóc?" }] },
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
      body: JSON.stringify({ contents })
    });

    if (!res.ok) throw new Error(`Błąd API: ${res.status}`);

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