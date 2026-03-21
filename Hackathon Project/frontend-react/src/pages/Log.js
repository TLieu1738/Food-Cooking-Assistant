import React, { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import AddMealModal from '../components/AddMealModal';
import { getTodaysMeals, deleteMeal, getTotals } from '../utils/storage';

export default function Log({ navigate }) {
  const [meals, setMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const data = await getTodaysMeals();
    setMeals(data);
  }

  async function handleDelete(id) {
    await deleteMeal(id);
    refresh();
  }

  const totals = getTotals(meals);

  return (
    <div>
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span className="nav-logo">Meal Log</span>
        <button onClick={() => setShowModal(true)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          + Add
        </button>
      </div>

      <div style={{ padding: '16px 20px', marginBottom: 40 }}>

        {/* TOTALS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Today's totals
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { val: Math.round(totals.cal), label: 'kcal' },
              { val: Math.round(totals.protein) + 'g', label: 'protein' },
              { val: '£' + totals.cost.toFixed(2), label: 'spent' }
            ].map(({ val, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ENTRIES */}
        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>No meals logged today.<br />Use the scanner or add manually.</div>
          </div>
        ) : (
          [...meals].reverse().map(m => (
            <MealCard key={m.id} meal={m} onDelete={handleDelete} />
          ))
        )}

        {/* ADD MANUALLY */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)', border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 14, padding: '14px 16px', color: 'var(--muted)',
            fontSize: 14, cursor: 'pointer', width: '100%',
            fontFamily: 'DM Sans, sans-serif', marginTop: 4
          }}>
          + Add meal manually
        </button>
      </div>

      {showModal && (
        <AddMealModal onClose={() => setShowModal(false)} onSaved={refresh} />
      )}
    </div>
  );
}
