import React, { useEffect, useRef, useState } from 'react';
import AddToPlanModal from '../components/AddToPlanModal';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const userProfile = {
  age: 35,
  goal: "Bulking",
  diet: "high protein",
  activity_level: "moderate"
};

export default function Scanner({ navigate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Starting camera...');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    initCamera();
    const video = videoRef.current;
    return () => {
      const stream = video?.srcObject;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('Ready — point at food and tap Scan');
    } catch {
      setStatus('Camera access denied — check your browser permissions');
    }
  }

  async function scan() {
    setLoading(true);
    setResult(null);
    setAdvice(null);
    setSaving(false);
    setSaved(false);
    setStatus('Analysing food...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const maxW = 800;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

    try {
      const res = await fetch(`${BACKEND}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ image: base64 })
      });
      const data = await res.json();
      setResult(data);

      if (data.error === 'not_food') {
        setStatus('');
        setLoading(false);
        return;
      }

      setStatus('Getting nutrition advice...');

      const coachRes = await fetch(`${BACKEND}/nutrition-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ user_profile: userProfile, food_data: data })
      });
      const coachData = await coachRes.json();
      setAdvice(coachData);
      setStatus('Done! Add to your log below.');

    } catch {
      setStatus('Error connecting to server — is Flask running?');
    }
    setLoading(false);
  }

  

  async function saveToDatabase() {
    if (!result || !advice) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/save-meal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          food_name: result.food_name,
          calories: result.calories_per_serving,
          protein_g: result.macros.protein_g,
          carbs_g: result.macros.carbs_g,
          fat_g: result.macros.fat_g,
          cost_gbp: result.cost_per_serving_gbp,
          advice: advice
        })
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
      } 

    } catch (err) {
      console.error(err);
    }

    setSaving(false);
  }
  
 
  // async function addToLog() {
  //   if (!result) return;
  //   setSaving(true);
  //   await saveMeal({
  //     food_name: result.food_name,
  //     calories: result.calories_per_serving,
  //     protein_g: result.macros.protein_g,
  //     carbs_g: result.macros.carbs_g,
  //     fat_g: result.macros.fat_g,
  //     cost: result.cost_per_serving_gbp
  //   });
  //   setSaving(false);
  //   setAddedToLog(true);
  // }

  return (
    <div>
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span className="nav-logo">Scanner</span>
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
          {loading ? <><span className="spinner" />Analysing...</> : 'Scan Food'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 16, minHeight: 20 }}>
          {status}
        </div>

        {/* NOT FOOD */}
        {result?.error === 'not_food' && (
          <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid rgba(255,90,90,0.3)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🚫</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>That's not food!</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Try pointing at something edible</div>
          </div>
        )}

        {/* FOOD RESULT */}
        {result && !result.error && (
          <>
            <div className="card fade-in">
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, textTransform: 'capitalize', marginBottom: 12 }}>
                {result.food_name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { val: result.calories_per_serving, label: 'kcal' },
                  { val: result.macros.protein_g + 'g', label: 'protein' },
                  { val: result.macros.carbs_g + 'g', label: 'carbs' },
                  { val: result.macros.fat_g + 'g', label: 'fat' }
                ].map(({ val, label }) => (
                  <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700 }}>{val}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                Estimated cost <strong style={{ color: 'var(--accent)' }}>£{result.cost_per_serving_gbp.toFixed(2)}/serving</strong>
              </div>
              {/* <button
                onClick={addToLog}
                disabled={addedToLog || saving}
                style={{
                  width: '100%', padding: 13,
                  background: addedToLog ? 'rgba(200,240,74,0.15)' : 'transparent',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: 12,
                  fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600,
                  cursor: addedToLog ? 'default' : 'pointer'
                }}>
                {saving ? <><span className="spinner" />Saving...</> : addedToLog ? '✓ Added to log!' : '+ Add to today\'s meal log'}
              </button> */}
            </div>

            {/* RECIPES */}
            {result.recipes.map((r, i) => (
              <div key={i} className="card fade-in">
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                  {r.difficulty} · {r.time_minutes} min · £{r.cost_gbp.toFixed(2)}
                </div>
                <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                  {r.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </div>
            ))}

            {/* AI NUTRITION COACH */}
            {advice && !advice.error && (
              <div className="card fade-in" style={{ border: '1px solid rgba(200,240,74,0.3)' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                  🤖 AI Nutrition Coach
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    background: 'var(--accent)', color: '#0a0a0a',
                    borderRadius: 10, padding: '6px 14px',
                    fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800
                  }}>
                    {advice.health_score}/10
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{advice.summary}</div>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--accent)' }}>
                  ✅ Good Points
                </div>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
                  {advice.good_points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#ff9a3c' }}>
                  ⚡ Improvements
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                  <button
                    onClick={saveToDatabase}
                    disabled={saving || saved}
                    style={{
                      flex: 2, padding: 14, borderRadius: 12, border: 'none',
                      fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                      background: saved ? 'rgba(200,240,74,0.2)' : 'var(--accent)',
                      color: '#0a0a0a', cursor: saved ? 'default' : 'pointer'
                    }}
                  >
                    {saved ? '✓ Saved' : saving ? 'Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    disabled={!result}
                    style={{
                      flex: 1, padding: 14, borderRadius: 12,
                      border: '1px solid var(--accent)', background: 'transparent',
                      color: 'var(--accent)', fontFamily: 'Syne, sans-serif',
                      fontWeight: 700, fontSize: 15, cursor: 'pointer'
                    }}
                  >
                    📅 Plan
                  </button>
                </div>
                <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
                  {advice.improvements.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>🍽 Next meal: </span>
                  <span style={{ color: 'var(--muted)' }}>{advice.next_meal_suggestion}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showPlanModal && result && (
        <AddToPlanModal
          meal={{
            meal_name: result.food_name,
            calories: result.calories_per_serving,
            protein_g: result.macros?.protein_g,
            carbs_g: result.macros?.carbs_g,
            fat_g: result.macros?.fat_g,
            cost_gbp: result.cost_per_serving_gbp,
            recipes: result.recipes || null,
            source: 'scanner',
          }}
          onClose={() => setShowPlanModal(false)}
          onSaved={() => setShowPlanModal(false)}
        />
      )}
    </div>
  );
}
