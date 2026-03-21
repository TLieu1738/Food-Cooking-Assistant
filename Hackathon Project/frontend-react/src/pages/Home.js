import React, { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import AddMealModal from '../components/AddMealModal';
import CalorieBar from '../components/CalorieBar';
import { getTodaysMeals, deleteMeal, getTotals } from '../utils/storage';


const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

const token = localStorage.getItem("token");

export default function Home({ navigate }) {
  const [meals, setMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const data = await getTodaysMeals();
    setMeals(data);
  }

  async function handleDelete(id) {
    await deleteMeal(id);
    refresh();
  }

  async function sendFriendRequest() {
    try {
      const res = await fetch(`${BACKEND}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: friendEmail
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Friend request sent ✅");
        setFriendEmail("");
      } else {
        setMessage(data.error || "Failed to send request");
      }

    } catch (err) {
      setMessage("Server error");
    }
  }

  async function acceptFriendRequest(requestId) {
    try {
      const res = await fetch(`${BACKEND}/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: requestId
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Friend added 🎉");
      } else {
        setMessage(data.error || "Failed to accept");
      }

    } catch {
      setMessage("Server error");
    }
  }

  const totals = getTotals(meals);
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  return (
    <div>
      {/* NAV */}
      <div className="nav">
        <span className="nav-logo">NutriScan</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{today}</span>
      </div>

      {/* HERO */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Good day</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
          Track your<br />
          <span style={{ color: 'var(--accent)' }}>nutrition & budget</span>
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div style={{ margin: '0 20px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Today's summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { val: Math.round(totals.cal), label: 'kcal', accent: true },
            { val: Math.round(totals.protein) + 'g', label: 'protein' },
            { val: '£' + totals.cost.toFixed(2), label: 'spent' }
          ].map(({ val, label, accent }) => (
            <div key={label} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)' }}>
                {val}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <CalorieBar current={totals.cal} />
      </div>

      {/* FRIENDS */}
      <div style={{ marginTop: 30 }}>

        <h3>Add Friend</h3>

        <input
          type="email"
          placeholder="Friend email"
          value={friendEmail}
          onChange={(e) => setFriendEmail(e.target.value)}
        />

        <button onClick={sendFriendRequest}>
          Send Friend Request
        </button>

        {message && <p>{message}</p>}

      </div>

      {/* ACTION BUTTONS */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <button className="btn-primary" onClick={() => navigate('scanner')}>
          <div>
            <div>Scan Food</div>
            <div className="btn-sub">Identify food with your camera</div>
          </div>
          <span style={{ fontSize: 20 }}>→</span>
        </button>
        <button className="btn-primary" onClick={() => navigate('ingredients')}>
          <div>
            <div>Scan Ingredients</div>
            <div className="btn-sub">Identify ingredients with your camera</div>
          </div>
          <span style={{ fontSize: 20 }}>→</span>
        </button>
        <button className="btn-secondary" onClick={() => navigate('log')}>
          <div>
            <div>Meal Log</div>
            <div className="btn-sub light">View & manage today's meals</div>
          </div>
          <span style={{ fontSize: 20, color: 'var(--muted)' }}>→</span>
        </button>
      </div>

      {/* TODAY'S MEALS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>Today's meals</span>
        <button onClick={() => setShowModal(true)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          + Add manually
        </button>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 60 }}>
        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🍽️</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>No meals logged yet today.<br />Scan food or add manually.</div>
          </div>
        ) : (
          [...meals].reverse().map(m => (
            <MealCard key={m.id} meal={m} onDelete={handleDelete} />
          ))
        )}
      </div>

      {showModal && (
        <AddMealModal onClose={() => setShowModal(false)} onSaved={refresh} />
      )}
    </div>
  );
}
