import React from 'react';

export default function CalorieBar({ current, goal = 2000 }) {
  const pct = Math.min(Math.round((current / goal) * 100), 100);
  const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--accent)';

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
        <span>{Math.round(current)} / {goal} kcal</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}
