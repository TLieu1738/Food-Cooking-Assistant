import { useState, useEffect } from 'react';
import useCivicUser from '../utils/useCivicUser';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function Login({ navigate }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [identifier, setIdentifier] = useState(''); // email or username for signin
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: civicUser, signIn: civicSignIn, isLoading: civicLoading } = useCivicUser();

  useEffect(() => {
    if (civicUser) {
      navigate('home');
    }
  }, [civicUser, navigate]);

  async function handleSubmit() {
    if (mode === 'signin') {
      if (!identifier.trim() || !password.trim()) {
        setError('Please fill in all fields.');
        return;
      }
    } else {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all fields.');
        return;
      }
      if (!username.trim()) {
        setError('Username is required.');
        return;
      }
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const res = await fetch(`${BACKEND}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user_email', data.email);
          localStorage.setItem('username', data.username);
          navigate('home');
        } else {
          setError(data.error || 'Sign in failed.');
        }
      } else {
        const res = await fetch(`${BACKEND}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username })
        });
        const data = await res.json();
        if (data.id) {
          const loginRes = await fetch(`${BACKEND}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: email, password })
          });
          const loginData = await loginRes.json();
          if (loginData.access_token) {
            localStorage.setItem('token', loginData.access_token);
            localStorage.setItem('user_email', loginData.email);
            localStorage.setItem('username', loginData.username);
            navigate('home');
          } else {
            setMode('signin');
            setError('Account created — please sign in.');
          }
        } else {
          setError(data.error || 'Sign up failed.');
        }
      }
    } catch {
      setError('Could not reach server.');
    }
    setLoading(false);
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setPassword('');
    setIdentifier('');
    setUsername('');
    setEmail('');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>

      {/* LOGO */}
      <div style={{ paddingTop: 72, marginBottom: 48 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>
          NutriScan
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>
          Track nutrition & budget, effortlessly.
        </div>
      </div>

      {/* CARD */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>

        {/* TOGGLE */}
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {['signin', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setPassword(''); }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 10,
                fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#0a0a0a' : 'var(--muted)',
              }}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* FIELDS */}
        {mode === 'signin' ? (
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="you@example.com or Username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 14, padding: '10px 14px', background: 'rgba(255,90,90,0.1)', borderRadius: 10 }}>
            {error}
          </div>
        )}

        {/* SUBMIT */}
        <button
          className="btn-save"
          onClick={handleSubmit}
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
          {loading
            ? <><span className="spinner" />{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</>
            : mode === 'signin' ? 'Sign In' : 'Create Account'
          }
        </button>

        {/* DIVIDER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* CIVIC BUTTON */}
        <button
          onClick={civicSignIn}
          disabled={civicLoading}
          style={{
            width: '100%',
            padding: '13px',
            marginTop: 12,
            background: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            cursor: civicLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: civicLoading ? 0.6 : 1,
          }}>
          {civicLoading ? <span className="spinner" /> : '🔐'}
          Continue with Civic
        </button>
      </div>

      {/* SWITCH MODE */}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={switchMode} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
          {mode === 'signin' ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}