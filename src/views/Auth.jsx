import React, { useState } from 'react';
import { Logo } from '../components/Common';
import { supabase } from '../config/supabase';
import '../index.css';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) return setError('Wypełnij wszystkie pola.');
    if (password.length < 6) return setError('Hasło musi mieć co najmniej 6 znaków.');

    setLoading(true);
    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        // Tworzymy pusty rekord profilu dla nowego użytkownika w tabeli user_data
        if (data.user) {
          const { error: insertError } = await supabase.from('user_data').insert([{ user_id: data.user.id }]);
          if (insertError) console.error("Błąd tworzenia profilu:", insertError);
        }
        
        if (data.session) onLoginSuccess(email);
        else setError('Zarejestrowano! Sprawdź skrzynkę e-mail, aby potwierdzić konto.');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLoginSuccess(email);
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Nieprawidłowe dane logowania.' : 'Wystąpił błąd: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', backgroundColor: 'var(--bg-color, #0f0f0f)' }}>
      <div style={{ marginBottom: '2rem' }}><Logo /></div>
      <div className="ex-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--neon)' }}>{isRegister ? 'Dołącz do EvoTrain' : 'Witaj ponownie'}</h2>
        {error && <div style={{ padding: '10px', backgroundColor: '#ff444433', color: '#ff4444', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#888' }}>Adres E-mail</label>
            <input type="email" placeholder="trener@evotrain.pl" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#888' }}>Hasło</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--neon)', color: '#000', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Przetwarzanie...' : (isRegister ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: 0, color: '#aaa', fontSize: '0.9rem' }}>
          {isRegister ? 'Masz już konto?' : 'Nie masz konta?'} 
          <span onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ color: 'var(--neon)', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold', textDecoration: 'underline' }}>
            {isRegister ? 'Zaloguj się' : 'Załóż je teraz'}
          </span>
        </p>
      </div>
    </div>
  );
}