import { useState } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function AddToPlanModal({ meal, onClose, onSaved }) {
  const [name, setName] = useState(meal.meal_name || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const token = localStorage.getItem('token');
    await fetch(`${BACKEND}/meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        meal_name: name.trim(),
        scheduled_for: date,
        source: meal.source || 'manual',
        calories: meal.calories || null,
        protein_g: meal.protein_g || null,
        carbs_g: meal.carbs_g || null,
        fat_g: meal.fat_g || null,
        cost_gbp: meal.cost_gbp || null,
        description: meal.description || null,
        recipes: meal.recipes || null,
      }),
    });
    setSaving(false);
    onSaved?.();
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480, paddingBottom: 36 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>📅 Add to Meal Plan</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Meal name</div>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Chicken stir-fry"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Scheduled for</div>
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {meal.calories && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { val: meal.calories, label: 'kcal' },
              { val: (meal.protein_g || 0) + 'g', label: 'protein' },
              { val: (meal.carbs_g || 0) + 'g', label: 'carbs' },
              { val: (meal.fat_g || 0) + 'g', label: 'fat' },
            ].map(({ val, label }) => (
              <div key={label} style={{ flex: 1, background: 'var(--surface2)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 14, background: 'var(--surface2)', border: 'none',
            borderRadius: 12, color: 'var(--muted)', fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: 14, cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()} style={{
            flex: 2, padding: 14, background: name.trim() ? 'var(--accent)' : 'var(--surface2)',
            border: 'none', borderRadius: 12, color: name.trim() ? '#0a0a0a' : 'var(--muted)',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
            cursor: name.trim() ? 'pointer' : 'not-allowed'
          }}>{saving ? 'Saving...' : 'Add to Plan'}</button>
        </div>
      </div>
    </div>
  );
}
