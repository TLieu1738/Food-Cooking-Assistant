import { useState, useEffect } from 'react';
import AddToPlanModal from '../components/AddToPlanModal';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const SOURCE_STYLES = {
  scanner:     { bg: 'rgba(200,240,74,0.12)',  color: 'var(--accent)', label: '📷 Scanner' },
  ingredients: { bg: 'rgba(100,200,255,0.12)', color: '#64c8ff',       label: '🥦 Ingredients' },
  ai_chat:     { bg: 'rgba(180,100,255,0.12)', color: '#b464ff',       label: '🤖 AI Chef' },
  manual:      { bg: 'rgba(255,255,255,0.05)', color: 'var(--muted)',   label: '✏️ Manual' },
};

function formatDay(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = d.toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function MealPlanner({ navigate }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchPlan(); }, []);

  async function fetchPlan() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/meal-plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) setMeals(data);
    } catch {}
    setLoading(false);
  }

  async function deleteMeal(id) {
    const token = localStorage.getItem('token');
    await fetch(`${BACKEND}/meal-plan/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMeals(prev => prev.filter(m => m.id !== id));
  }

  // Build next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const grouped = days.reduce((acc, day) => {
    acc[day] = meals.filter(m => m.scheduled_for === day);
    return acc;
  }, {});

  const laterMeals = meals.filter(m => !days.includes(m.scheduled_for));

  return (
    <div>
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span className="nav-logo" style={{ fontSize: 16 }}>Meal Planner</span>
        <button onClick={() => setShowModal(true)} style={{
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: '0 4px'
        }}>+</button>
      </div>

      <div style={{ padding: '16px 20px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <span className="spinner" />
          </div>
        ) : (
          <>
            {days.map(day => (
              <div key={day} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>{formatDay(day)}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatShortDate(day)}</span>
                </div>

                {grouped[day].length === 0 ? (
                  <div style={{
                    background: 'var(--surface)', border: '1px dashed rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '14px 16px',
                    color: 'var(--muted)', fontSize: 13
                  }}>
                    No meals planned
                  </div>
                ) : (
                  grouped[day].map(m => (
                    <PlanCard key={m.id} meal={m} onDelete={deleteMeal} />
                  ))
                )}
              </div>
            ))}

            {laterMeals.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Later</div>
                {laterMeals.map(m => (
                  <PlanCard key={m.id} meal={m} onDelete={deleteMeal} showDate />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddToPlanModal
          meal={{ meal_name: '', source: 'manual' }}
          onClose={() => setShowModal(false)}
          onSaved={fetchPlan}
        />
      )}
    </div>
  );
}

function PlanCard({ meal, onDelete, showDate }) {
  const [open, setOpen] = useState(false);
  const src = SOURCE_STYLES[meal.source] || SOURCE_STYLES.manual;
  const hasDetail = meal.recipes?.length || meal.description;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, marginBottom: 8, overflow: 'hidden'
    }}>
      {/* Header row */}
      <div
        onClick={() => hasDetail && setOpen(o => !o)}
        style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: hasDetail ? 'pointer' : 'default' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 5, textTransform: 'capitalize' }}>
            {meal.meal_name}
            {hasDetail && <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--muted)', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>↓</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: meal.calories ? 6 : 0 }}>
            <span style={{ fontSize: 11, background: src.bg, color: src.color, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
              {src.label}
            </span>
            {showDate && (
              <span style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 6px' }}>
                {formatShortDate(meal.scheduled_for)}
              </span>
            )}
          </div>
          {meal.calories && (
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
              <span>{meal.calories} kcal</span>
              {meal.protein_g && <span>{meal.protein_g}g protein</span>}
              {meal.cost_gbp && <span>£{Number(meal.cost_gbp).toFixed(2)}</span>}
            </div>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(meal.id); }} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 20, cursor: 'pointer', padding: '0 0 0 10px', lineHeight: 1, flexShrink: 0
        }}>×</button>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 14px 16px' }}>

          {/* Macros grid */}
          {meal.calories && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { val: meal.calories, label: 'kcal' },
                { val: (meal.protein_g || 0) + 'g', label: 'protein' },
                { val: (meal.carbs_g || 0) + 'g', label: 'carbs' },
                { val: (meal.fat_g || 0) + 'g', label: 'fat' },
              ].map(({ val, label }) => (
                <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700 }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recipes */}
          {meal.recipes?.map((r, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{r.name}</div>
              {(r.difficulty || r.time_minutes || r.cost_gbp) && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                  {[r.difficulty, r.time_minutes && `${r.time_minutes} min`, r.cost_gbp && `£${Number(r.cost_gbp).toFixed(2)}`].filter(Boolean).join(' · ')}
                </div>
              )}
              {r.steps?.length > 0 && (
                <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                  {r.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              )}
            </div>
          ))}

          {/* AI chat description */}
          {meal.description && !meal.recipes?.length && (
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {meal.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
