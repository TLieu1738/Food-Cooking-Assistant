import { useState, useEffect } from 'react';

export default function CalorieBar({ current, goal = 2000, protein, proteinGoal = 150, cost, budget = 50 }) {
  const [idx, setIdx] = useState(0);

  const metrics = [
    { label: 'kcal',    current: current, goal, unit: ' kcal', format: v => Math.round(v) },
    { label: 'protein', current: protein, goal: proteinGoal, unit: 'g',    format: v => Math.round(v) },
    { label: 'budget',  current: cost,    goal: budget,       unit: '',     format: v => '£' + v.toFixed(2), goalFormat: v => '£' + v.toFixed(2) },
  ];

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % metrics.length), 5000);
    return () => clearInterval(t);
  }, [metrics.length]);

  const m = metrics[idx];
  const pct = Math.min(Math.round(((m.current || 0) / m.goal) * 100), 100);
  const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--accent)';
  const displayCurrent = m.format(m.current || 0);
  const displayGoal = m.goalFormat ? m.goalFormat(m.goal) : m.format(m.goal) + m.unit;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
        <span style={{ transition: 'opacity 0.3s' }}>
          {displayCurrent}{m.unit && m.label !== 'budget' ? m.unit : ''} / {displayGoal}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {metrics.map((_, i) => (
              <div key={i} style={{
                width: i === idx ? 16 : 5, height: 5,
                borderRadius: 99,
                background: i === idx ? color : 'var(--surface2)',
                transition: 'all 0.4s ease'
              }} />
            ))}
          </div>
          <span>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {m.label}
      </div>
    </div>
  );
}
