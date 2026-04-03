import React, { useState } from 'react';
import { Logo } from '../components/Common';
import '../index.css';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Prosta walidacja
    if (!email || !password) {
      setError('Wypełnij wszystkie pola.');
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    // TODO: Tutaj w przyszłości podepniesz API (np. Firebase Auth, Supabase lub własny backend w Node.js)
    // Na ten moment symulujemy poprawne logowanie/rejestrację:
    console.log(isRegister ? 'Rejestracja użytkownika:' : 'Logowanie użytkownika:', email);
    
    // Zapisanie sesji (np. do localStorage) i wywołanie funkcji z App.jsx
    localStorage.setItem('evotrain_user', email);
    onLoginSuccess(email);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: '20px',
      backgroundColor: 'var(--bg-color, #0f0f0f)' // Fallback do ciemnego tła
    }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <Logo />
      </div>

      <div className="ex-card" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--neon)' }}>
          {isRegister ? 'Dołącz do EvoTrain' : 'Witaj ponownie'}
        </h2>

        {error && (
          <div style={{ padding: '10px', backgroundColor: '#ff444433', color: '#ff4444', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#888' }}>Adres E-mail</label>
            <input 
              type="email" 
              placeholder="trener@evotrain.pl" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              style={{ 
                padding: '0.8rem', 
                borderRadius: '8px', 
                border: '1px solid #333', 
                background: '#1a1a1a', 
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#888' }}>Hasło</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{ 
                padding: '0.8rem', 
                borderRadius: '8px', 
                border: '1px solid #333', 
                background: '#1a1a1a', 
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              border: 'none', 
              background: 'var(--neon)', 
              color: '#000', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              marginTop: '0.5rem',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = 0.8}
            onMouseOut={(e) => e.target.style.opacity = 1}
          >
            {isRegister ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: 0, color: '#aaa', fontSize: '0.9rem' }}>
          {isRegister ? 'Masz już konto?' : 'Nie masz konta?'} 
          <span 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }} 
            style={{ 
              color: 'var(--neon)', 
              cursor: 'pointer', 
              marginLeft: '8px',
              fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Zaloguj się' : 'Załóż je teraz'}
          </span>
        </p>
      </div>
    </div>
  );
}