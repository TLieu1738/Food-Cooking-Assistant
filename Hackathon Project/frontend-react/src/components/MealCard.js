import React from 'react';

export default function MealCard({ meal, onDelete }) {
  const time = new Date(meal.timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fade-in" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 16px',
      marginBottom: 8,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize', marginBottom: 3 }}>
          {meal.food_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {meal.protein_g || 0}g protein · {time}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
            {meal.calories} kcal
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            £{(meal.cost || 0).toFixed(2)}
          </div>
        </div>
        <button
          onClick={() => onDelete(meal.id)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
