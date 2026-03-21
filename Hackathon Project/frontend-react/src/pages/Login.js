import { useState } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function Login({ navigate }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 5) {
      setError('Password must be at least 5 characters.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const res = await fetch(`${BACKEND}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
          navigate('home');
        } else {
          setError(data.error || 'Sign in failed.');
        }
      } else {
        const res = await fetch(`${BACKEND}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.id || data.user_id) {
          setMode('signin');
          setError('');
          setPassword('');
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
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
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
