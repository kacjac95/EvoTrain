import React, { useState, useEffect } from 'react';
import { loadPlan, loadSess, savePlan } from './utils/helpers';
import { TransitionScreen, AcceptTransition } from './components/Common';
import Auth from './views/Auth';
import Chat from './views/Chat';
import PlanPreview from './views/PlanPreview';
import ProgressDashboard from './views/Dashboard';
import { supabase } from './config/supabase';
import './index.css';

export default function App() {
  // Zaczynamy od stanu 'init', aby zapobiec mignięciu czatu przed wczytaniem sesji
  const [phase, setPhase] = useState('init'); 
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // 1. Rygorystyczne sprawdzenie sesji przy uruchomieniu aplikacji
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setPhase('auth'); // Zablokowanie dostępu - przymusowe logowanie
      } else {
        fetchUserData(session.user);
      }
    });

    // 2. Globalny strażnik: jeśli użytkownik się wyloguje, wyrzuć go do logowania
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setPhase('auth');
        setPlan(null);
        setSessions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (user) => {
    try {
      const { data, error } = await supabase.from('user_data').select('*').eq('user_id', user.id).single();
      
      if (data) {
        if (data.plan) setPlan(data.plan);
        if (data.sessions) setSessions(data.sessions);
        if (data.params) localStorage.setItem('evotrain_user_params', JSON.stringify(data.params));
        
        // Użytkownik zalogowany: jeśli ma już plan -> dashboard, w przeciwnym razie -> wywiad
        setPhase(data.plan ? 'dashboard' : 'chat');
      } else {
        // Zalogowany, ale brak jakichkolwiek danych (świeże konto) -> wywiad
        setPhase('chat');
      }
    } catch (err) {
      console.error("Błąd uwierzytelniania profilu:", err);
      setPhase('auth'); // W razie błędu również odsyłamy do logowania
    }
  };

  const handleChatComplete = p => { setPlan(p); setPhase('loading'); };

  const handleAccept = () => {
    const accepted = {...plan, acceptedAt: Date.now()};
    savePlan(accepted); 
    setPlan(accepted);
    setPhase('accept_anim');
  };

  const handleNewPlan = () => { setPlan(null); setSessions([]); setPhase('chat'); };

  // Ekran ładowania podczas weryfikacji bazy danych na start
  if(phase === 'init') return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',backgroundColor:'var(--bg-color)'}}>
      <div style={{color:'var(--neon)', fontFamily:'JetBrains Mono', fontSize: '1rem', letterSpacing: '2px'}} className="pulse">
        AUTORYZACJA...
      </div>
    </div>
  );

  // Blokowanie dostępu - Auth.jsx jest pierwszym widokiem jaki zobaczy niezalogowany
  if(phase === 'auth')         return <Auth onLoginSuccess={() => { supabase.auth.getUser().then(({data}) => fetchUserData(data.user)) }} />;
  if(phase === 'chat')         return <Chat onComplete={handleChatComplete} />;
  if(phase === 'loading')      return <TransitionScreen onDone={() => setPhase('plan_preview')} />;
  if(phase === 'plan_preview') return <PlanPreview plan={plan} setPlan={setPlan} onAccept={handleAccept} onReset={() => setPhase('chat')} />;
  if(phase === 'accept_anim')  return <AcceptTransition onDone={() => setPhase('dashboard')} />;
  if(phase === 'dashboard')    return <ProgressDashboard plan={plan} setPlan={setPlan} sessions={sessions} setSessions={setSessions} onNewPlan={handleNewPlan} />;

  return null;
}