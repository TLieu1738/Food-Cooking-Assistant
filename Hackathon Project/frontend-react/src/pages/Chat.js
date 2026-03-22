import { useState, useRef, useEffect } from 'react';
import useCivicUser from '../utils/useCivicUser';
import AddToPlanModal from '../components/AddToPlanModal';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const SUGGESTIONS = [
  'What should I eat for breakfast?',
  'How do I cook rice perfectly?',
  'What\'s a high-protein budget meal?',
  'How many calories should I eat daily?',
];

export default function Chat({ navigate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [goalToast, setGoalToast] = useState(false);
  const [planMeal, setPlanMeal] = useState(null);
  const bottomRef = useRef(null);
  const { user: civicUser } = useCivicUser();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.goal_updated && data.goal_values) {
        localStorage.setItem('goals', JSON.stringify(data.goal_values));
        setGoalToast(true);
        setTimeout(() => setGoalToast(false), 3000);
      }
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I could not connect to the server. Please try again.',
      }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* NAV */}
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span className="nav-logo" style={{ fontSize: 16 }}>AI Chef</span>
        {civicUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)' }}>
            <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
            Civic
          </div>
        )}
      </div>

      {goalToast && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--accent)', color: '#0a0a0a',
          borderRadius: 12, padding: '10px 18px',
          fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif',
          zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'fadeInDown 0.3s ease'
        }}>
          🎯 Goals updated!
        </div>
      )}

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: 100 }}>
        {messages.length === 0 ? (
          <div style={{ paddingTop: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🍳</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                Your AI Chef
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                Ask me anything about food,<br />nutrition, or cooking.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                  color: msg.role === 'user' ? '#0a0a0a' : 'var(--text)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: 14, lineHeight: 1.6,
                  fontFamily: 'DM Sans, sans-serif', whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => setPlanMeal({ meal_name: '', source: 'ai_chat', description: msg.content })}
                  style={{
                    marginTop: 4, background: 'none', border: 'none',
                    color: 'var(--muted)', fontSize: 12, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', padding: '2px 4px'
                  }}
                >
                  📅 Save to Plan
                </button>
              )}
            </div>
          ))
        )}

        {loading && (
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <div style={{
              padding: '14px 18px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '18px 18px 18px 4px',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    background: 'var(--muted)',
                    borderRadius: '50%',
                    animation: `chatBounce 0.8s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        padding: '12px 16px 28px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about nutrition or recipes..."
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 16px',
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: 'DM Sans, sans-serif',
            outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{
            width: 44,
            height: 44,
            background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: input.trim() && !loading ? '#0a0a0a' : 'var(--muted)',
            flexShrink: 0,
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          ↑
        </button>
      </div>

      {planMeal && (
        <AddToPlanModal
          meal={planMeal}
          onClose={() => setPlanMeal(null)}
          onSaved={() => setPlanMeal(null)}
        />
      )}

      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
