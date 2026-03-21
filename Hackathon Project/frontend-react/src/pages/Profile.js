import { useState, useEffect, useRef } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

// Lightweight SVG line chart — no library needed
function LineChart({ data, goalValue, color, unit, label }) {
  const W = 320, H = 140, PX = 12, PY = 16;
  const days = data.map(d => d.day);
  const values = data.map(d => d.value);

  const maxVal = Math.max(...values, goalValue * 1.1, 1);
  const minVal = 0;

  function xPos(i) {
    return PX + (i / (days.length - 1)) * (W - PX * 2);
  }
  function yPos(v) {
    return PY + (1 - (v - minVal) / (maxVal - minVal)) * (H - PY * 2);
  }

  // Today's index (0=Mon)
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  // Build path
  const points = values.map((v, i) => `${xPos(i)},${yPos(v)}`);
  const linePath = `M ${points.join(' L ')}`;

  // Area fill path
  const areaPath = `M ${xPos(0)},${yPos(0)} L ${points.join(' L ')} L ${xPos(days.length - 1)},${yPos(0)} Z`;

  // Goal line Y
  const goalY = yPos(goalValue);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Goal line */}
      <line
        x1={PX} y1={goalY} x2={W - PX} y2={goalY}
        stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.4"
      />
      <text x={W - PX + 2} y={goalY + 4} fontSize="9" fill={color} opacity="0.6">
        goal
      </text>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${label})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Day labels + dots */}
      {days.map((day, i) => {
        const x = xPos(i);
        const y = yPos(values[i]);
        const isToday = i === todayIdx;
        const hasData = values[i] > 0;
        return (
          <g key={day}>
            {/* Dot */}
            <circle
              cx={x} cy={y} r={isToday ? 5 : 3.5}
              fill={hasData ? color : 'transparent'}
              stroke={color}
              strokeWidth={isToday ? 2 : 1}
              opacity={hasData ? 1 : 0.3}
            />
            {/* Value label above dot (only if has data) */}
            {hasData && (
              <text
                x={x} y={y - 8}
                fontSize="9" fill={color} textAnchor="middle" opacity="0.85"
              >
                {values[i]}{unit === 'g' ? 'g' : ''}
              </text>
            )}
            {/* Day label */}
            <text
              x={x} y={H - 2}
              fontSize="9"
              fill={isToday ? color : 'rgba(136,136,136,0.8)'}
              textAnchor="middle"
              fontWeight={isToday ? '700' : '400'}
            >
              {day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Profile({ navigate }) {
  const [weekData, setWeekData] = useState(null);
  const [goals, setGoals] = useState({ calories: 2000, protein: 150 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const email = localStorage.getItem('user_email') || '';
  const name = localStorage.getItem('username') || email.split('@')[0] || 'You';
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    async function load() {
      try {
        const [weekRes, goalsRes] = await Promise.all([
          fetch(`${BACKEND}/meals/week`, { headers: authHeaders() }),
          fetch(`${BACKEND}/goals`,      { headers: authHeaders() })
        ]);
        const weekJson  = await weekRes.json();
        const goalsJson = await goalsRes.json();

        if (!weekJson.error)  setWeekData(weekJson);
        if (!goalsJson.error) setGoals(goalsJson);
      } catch {
        setError('Could not load data.');
      }
      setLoading(false);
    }
    load();
  }, []);

  // Today's stats
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayData = weekData ? weekData[todayIdx] : null;

  return (
    <div>
      {/* NAV */}
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Profile</span>
        <span style={{ width: 48 }} />
      </div>

      {/* AVATAR + NAME */}
      <div style={{ padding: '28px 20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--accent)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'Syne, sans-serif',
          fontSize: 24, fontWeight: 800, color: '#0a0a0a', flexShrink: 0
        }}>
          {initial}
        </div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 }}>{name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{email}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <span className="spinner" />
        </div>
      ) : error ? (
        <div style={{ margin: '0 20px', padding: '14px', background: 'rgba(255,90,90,0.1)', borderRadius: 12, color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <div style={{ padding: '0 20px', paddingBottom: 60 }}>

          {/* TODAY SNAPSHOT */}
          {todayData && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Today
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  {
                    val: todayData.calories,
                    goal: goals.calories,
                    label: 'kcal',
                    color: '#C8F04A'
                  },
                  {
                    val: todayData.protein,
                    goal: goals.protein,
                    label: 'protein',
                    color: '#60A5FA'
                  }
                ].map(({ val, goal, label, color }) => {
                  const pct = Math.min(Math.round((val / goal) * 100), 100);
                  return (
                    <div key={label} style={{ background: 'var(--surface2)', borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>/ {goal} goal</div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                      <div style={{ fontSize: 10, color, marginTop: 4, textAlign: 'right' }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CALORIE CHART */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Calories</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>this week</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Goal: {goals.calories} kcal/day
            </div>
            <LineChart
              data={weekData.map(d => ({ day: d.day, value: d.calories }))}
              goalValue={goals.calories}
              color="#C8F04A"
              unit="kcal"
              label="cal"
            />
          </div>

          {/* PROTEIN CHART */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Protein</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>this week</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Goal: {goals.protein}g/day
            </div>
            <LineChart
              data={weekData.map(d => ({ day: d.day, value: d.protein }))}
              goalValue={goals.protein}
              color="#60A5FA"
              unit="g"
              label="protein"
            />
          </div>

          {/* WEEKLY SUMMARY */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
              Week summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(() => {
                const daysLogged = weekData.filter(d => d.calories > 0).length;
                const avgCal = daysLogged > 0 ? Math.round(weekData.reduce((s, d) => s + d.calories, 0) / daysLogged) : 0;
                const avgProtein = daysLogged > 0 ? Math.round(weekData.reduce((s, d) => s + d.protein, 0) / daysLogged) : 0;
                const calGoalDays = weekData.filter(d => d.calories > 0 && d.calories >= goals.calories * 0.9).length;
                const proteinGoalDays = weekData.filter(d => d.protein > 0 && d.protein >= goals.protein * 0.9).length;
                return [
                  { label: 'Days logged', val: `${daysLogged}/7` },
                  { label: 'Avg calories', val: `${avgCal} kcal` },
                  { label: 'Avg protein',  val: `${avgProtein}g` },
                  { label: 'Goal hit days', val: `${Math.max(calGoalDays, proteinGoalDays)}/7` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{val}</div>
                  </div>
                ));
              })()}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}