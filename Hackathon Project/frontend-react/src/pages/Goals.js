import { useState, useEffect } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function Goals({ navigate }) {
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein]   = useState('150');
  const [budget, setBudget]     = useState('50');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function fetchGoals() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND}/goals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.error) {
          setCalories(String(data.calories));
          setProtein(String(data.protein));
          setBudget(String(data.budget));
        }
      } catch {
        // Use defaults if fetch fails
      }
      setLoading(false);
    }
    fetchGoals();
  }, []);

  async function handleSave() {
    setError('');
    if (!calories || !protein || !budget) {
      setError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          calories: parseInt(calories),
          protein: parseInt(protein),
          budget: parseFloat(budget)
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError('Could not reach server.');
    }
    setSaving(false);
  }

  return (
    <div>
      {/* NAV */}
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Goals</span>
        <span style={{ width: 48 }} />
      </div>

      {/* HEADER */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Daily targets</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
          Set your<br />
          <span style={{ color: 'var(--accent)' }}>daily goals</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <span className="spinner" />
        </div>
      ) : (
        <div style={{ padding: '0 20px' }}>

          {/* CALORIES */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Calories</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Daily calorie target</div>
              </div>
              <span style={{ fontSize: 24 }}>🔥</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                className="form-input"
                type="number"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                min="500"
                max="10000"
                style={{ flex: 1, fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 700, textAlign: 'center', color: 'var(--accent)' }}
              />
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>kcal</span>
            </div>
            {/* Quick presets */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[1500, 2000, 2500].map(v => (
                <button key={v} onClick={() => setCalories(String(v))}
                  style={{
                    flex: 1, padding: '8px 0', border: '1px solid var(--border)',
                    borderRadius: 10, background: calories === String(v) ? 'var(--accent)' : 'var(--surface2)',
                    color: calories === String(v) ? '#0a0a0a' : 'var(--muted)',
                    fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: 'pointer'
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* PROTEIN */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Protein</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Daily protein target</div>
              </div>
              <span style={{ fontSize: 24 }}>💪</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                className="form-input"
                type="number"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                min="10"
                max="500"
                style={{ flex: 1, fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 700, textAlign: 'center', color: 'var(--accent)' }}
              />
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>g</span>
            </div>
            {/* Quick presets */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[100, 150, 200].map(v => (
                <button key={v} onClick={() => setProtein(String(v))}
                  style={{
                    flex: 1, padding: '8px 0', border: '1px solid var(--border)',
                    borderRadius: 10, background: protein === String(v) ? 'var(--accent)' : 'var(--surface2)',
                    color: protein === String(v) ? '#0a0a0a' : 'var(--muted)',
                    fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: 'pointer'
                  }}>
                  {v}g
                </button>
              ))}
            </div>
          </div>

          {/* BUDGET */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Budget</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Daily spending limit</div>
              </div>
              <span style={{ fontSize: 24 }}>💷</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>£</span>
              <input
                className="form-input"
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                min="1"
                max="999"
                step="0.50"
                style={{ flex: 1, fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 700, textAlign: 'center', color: 'var(--accent)' }}
              />
            </div>
            {/* Quick presets */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[20, 50, 100].map(v => (
                <button key={v} onClick={() => setBudget(String(v))}
                  style={{
                    flex: 1, padding: '8px 0', border: '1px solid var(--border)',
                    borderRadius: 10, background: budget === String(v) ? 'var(--accent)' : 'var(--surface2)',
                    color: budget === String(v) ? '#0a0a0a' : 'var(--muted)',
                    fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: 'pointer'
                  }}>
                  £{v}
                </button>
              ))}
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 14, padding: '10px 14px', background: 'rgba(255,90,90,0.1)', borderRadius: 10 }}>
              {error}
            </div>
          )}

          {/* SAVE */}
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving}
            style={{
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
              marginBottom: 40,
              background: saved ? 'var(--accent)' : 'var(--accent)',
              transition: 'all 0.2s'
            }}>
            {saving ? <><span className="spinner" />Saving...</> : saved ? '✓ Saved!' : 'Save Goals'}
          </button>

        </div>
      )}
    </div>
  );
}