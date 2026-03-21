import React, { useEffect, useRef, useState } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

export default function Ingredients({ navigate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Starting camera...');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedDish, setExpandedDish] = useState(null);

  useEffect(() => {
    initCamera();
  }, []);

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('Ready — point at your ingredients and tap Scan');
    } catch {
      setStatus('Camera access denied — check your browser permissions');
    }
  }

  async function scan() {
    setLoading(true);
    setResult(null);
    setExpandedDish(null);
    setStatus('Identifying ingredients with Claude Vision...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

    try {
      const res = await fetch(`${BACKEND}/from-ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ image: base64 })
      });
      const data = await res.json();
      setResult(data);
      setStatus(data.error === 'not_ingredients' ? '' : `Found ${data.ingredients_detected?.length || 0} ingredients — here's what you can make!`);
    } catch {
      setStatus('Error connecting to server — is Flask running?');
    }
    setLoading(false);
  }

  function toggleDish(i) {
    setExpandedDish(prev => prev === i ? null : i);
  }

  function healthColor(score) {
    if (score >= 8) return '#c8f04a';
    if (score >= 5) return '#f0c84a';
    return '#ff6b6b';
  }

  return (
    <div>
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span className="nav-logo">Ingredients</span>
        <span style={{ width: 60 }} />
      </div>

      <div style={{ padding: 20 }}>
        <video ref={videoRef} autoPlay playsInline
          style={{ width: '100%', borderRadius: 16, background: '#000', maxHeight: 300, objectFit: 'cover' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <button
          onClick={scan}
          disabled={loading}
          style={{
            width: '100%', padding: 16, marginTop: 14, marginBottom: 10,
            background: loading ? 'var(--surface2)' : 'var(--accent)',
            color: loading ? 'var(--muted)' : '#0a0a0a',
            border: 'none', borderRadius: 14,
            fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
          {loading ? <><span className="spinner" />Analysing...</> : 'Scan Ingredients'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 16, minHeight: 20 }}>
          {status}
        </div>

        {/* NOT INGREDIENTS */}
        {result?.error === 'not_ingredients' && (
          <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid rgba(255,90,90,0.3)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🤔</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>No ingredients found!</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Try pointing at food items in your fridge or kitchen</div>
          </div>
        )}

        {/* RESULTS */}
        {result && !result.error && (
          <>
            {/* Detected ingredients chips */}
            <div className="card fade-in">
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                Detected Ingredients
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.ingredients_detected?.map((ing, i) => (
                  <span key={i} style={{
                    background: 'var(--surface2)',
                    border: '1px solid rgba(200,240,74,0.2)',
                    borderRadius: 20,
                    padding: '5px 12px',
                    fontSize: 12,
                    color: 'var(--accent)',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Dish cards */}
            {result.dishes?.map((dish, i) => {
              const n = dish.nutrition || {};
              const isOpen = expandedDish === i;

              return (
                <div key={i} className="card fade-in">
                  {/* Dish header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                        {dish.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {dish.difficulty} · {dish.time_minutes} min · £{(dish.cost_gbp || 0).toFixed(2)}
                      </div>
                    </div>
                    {/* Health score badge */}
                    <div style={{
                      background: 'var(--surface2)',
                      borderRadius: 10,
                      padding: '6px 10px',
                      textAlign: 'center',
                      minWidth: 52,
                      flexShrink: 0
                    }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: healthColor(n.health_score) }}>
                        {n.health_score}/10
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>health</div>
                    </div>
                  </div>

                  {/* Health bar */}
                  <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 5, marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(n.health_score || 0) * 10}%`,
                      height: '100%',
                      background: healthColor(n.health_score),
                      borderRadius: 4,
                      transition: 'width 0.8s ease'
                    }} />
                  </div>

                  {/* Macros */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { val: n.calories_per_serving, label: 'kcal' },
                      { val: (n.protein_g || '—') + 'g', label: 'protein' },
                      { val: (n.carbs_g || '—') + 'g', label: 'carbs' },
                      { val: (n.fat_g || '—') + 'g', label: 'fat' }
                    ].map(({ val, label }) => (
                      <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700 }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Missing ingredients */}
                  {dish.missing_ingredients?.length > 0 && (
                    <div style={{
                      background: 'rgba(255,150,50,0.08)',
                      border: '1px solid rgba(255,150,50,0.2)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      marginBottom: 12,
                      fontSize: 12,
                      color: 'var(--muted)'
                    }}>
                      <span style={{ color: '#ff9640', fontWeight: 600 }}>Also needed: </span>
                      {dish.missing_ingredients.join(', ')}
                    </div>
                  )}

                  {/* Steps toggle */}
                  <button
                    onClick={() => toggleDish(i)}
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: 'transparent',
                      border: '1px solid var(--surface2)',
                      color: 'var(--muted)',
                      borderRadius: 10,
                      fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                    <span>{isOpen ? 'Hide steps' : 'View steps'}</span>
                    <span style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>↓</span>
                  </button>

                  {isOpen && (
                    <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginTop: 12 }}>
                      {dish.steps?.map((s, j) => <li key={j} style={{ marginBottom: 4 }}>{s}</li>)}
                    </ol>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}