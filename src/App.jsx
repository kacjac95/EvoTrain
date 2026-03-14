import React, { useState } from 'react';
import { loadPlan, loadSess, savePlan } from './utils/helpers';
import { TransitionScreen, AcceptTransition } from './components/Common';
import Chat from './views/Chat';
import PlanPreview from './views/PlanPreview';
import ProgressDashboard from './views/Dashboard';
import './index.css'; // Zakładam, że styl pozostaje bez zmian

export default function App() {
  const savedPlan = loadPlan();
  const [phase, setPhase] = useState(savedPlan ? 'dashboard' : 'chat');
  const [plan, setPlan] = useState(savedPlan);
  const [sessions, setSessions] = useState(loadSess());

  const handleChatComplete = p => { setPlan(p); setPhase('loading'); };

  const handleAccept = () => {
    const accepted = {...plan, acceptedAt: Date.now()};
    savePlan(accepted); 
    setPlan(accepted);
    setPhase('accept_anim');
  };

  const handleNewPlan = () => { setPlan(null); setSessions([]); setPhase('chat'); };

  if(phase === 'chat')         return <Chat onComplete={handleChatComplete} />;
  if(phase === 'loading')      return <TransitionScreen onDone={() => setPhase('plan_preview')} />;
  if(phase === 'plan_preview') return <PlanPreview plan={plan} setPlan={setPlan} onAccept={handleAccept} onReset={() => setPhase('chat')} />;
  if(phase === 'accept_anim')  return <AcceptTransition onDone={() => setPhase('dashboard')} />;
  if(phase === 'dashboard')    return <ProgressDashboard plan={plan} setPlan={setPlan} sessions={sessions} setSessions={setSessions} onNewPlan={handleNewPlan} />;

  return null;
}