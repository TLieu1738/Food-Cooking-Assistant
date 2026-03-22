import { useState, useEffect } from 'react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;
console.log("BACKEND URL:", BACKEND);

export default function Friends({ navigate }) {
  const token = localStorage.getItem('token');
  const [tab, setTab]           = useState('add');
  const [friendEmail, setFriendEmail] = useState('');
  const [requests, setRequests] = useState([]);
  const [friends, setFriends]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRequests(); }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'requests') fetchRequests();
    if (tab === 'list') fetchFriends();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  function showMessage(text) {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  }

  function showError(text) {
    setError(text);
    setTimeout(() => setError(''), 3000);
  }

  async function fetchRequests() {
    setLoading(true);
    console.log("TOKEN:", token);
    console.log("FULL URL:", `${BACKEND}/friends/requests`);
    try {
      const res = await fetch(`${BACKEND}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("STATUS:", res.status);
      const data = await res.json();
      console.log("DATA:", data);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      console.log("ERROR:", error);
      showError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchFriends() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/friends/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFriends(Array.isArray(data) ? data : []);
    } catch {
      showError('Failed to load friends.');
    } finally {
      setLoading(false);
    }
  }


  async function sendFriendRequest() {
    setError('');
    if (!friendEmail.trim()) {
      showError('Please enter an email address.');
      return;
    }
    try {
      const res = await fetch(`${BACKEND}/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: friendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('Friend request sent ✅');
        setFriendEmail('');
      } else {
        const errors = {
          user_not_found: 'No user found with that email.',
          already_friends: "You're already friends!",
          request_already_exists: 'Request already sent.',
          cannot_add_self: "You can't add yourself.",
        };
        showError(errors[data.error] || 'Failed to send request.');
      }
    } catch {
      showError('Could not reach server.');
    }
  }

  async function respondToRequest(requestId, action) {
    try {
      const res = await fetch(`${BACKEND}/friends/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ request_id: requestId }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(action === 'accept' ? 'Friend added 🎉' : 'Request declined.');
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        showError(data.error || 'Failed.');
      }
    } catch {
      showError('Could not reach server.');
    }
  }

  async function removeFriend(friendId) {
    try {
      const res = await fetch(`${BACKEND}/friends/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friend_id: friendId }),
      });
      if (res.ok) {
        showMessage('Friend removed.');
        setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
      }
    } catch {
      showError('Could not reach server.');
    }
  }

  const tabList = [
    { key: 'add', label: 'Add Friend' },
    { key: 'requests', label: requests.length > 0 && tab !== 'requests' ? `Requests (${requests.length})` : 'Requests' },
    { key: 'list', label: 'My Friends' },
  ];

  return (
    <div>
      {/* NAV */}
      <div className="nav">
        <button className="nav-back" onClick={() => navigate('home')}>← Back</button>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Friends</span>
        <span style={{ width: 48 }} />
      </div>

      {/* HEADER */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Social</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
          Manage your<br />
          <span style={{ color: 'var(--accent)' }}>friends</span>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {tabList.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: '9px 4px',
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: tab === key ? 'var(--accent)' : 'var(--surface2)',
                color: tab === key ? '#0a0a0a' : 'var(--muted)',
                fontSize: 12,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 14, padding: '10px 14px', background: 'rgba(200,241,53,0.1)', borderRadius: 10, fontWeight: 600 }}>
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 14, padding: '10px 14px', background: 'rgba(255,90,90,0.1)', borderRadius: 10 }}>
            {error}
          </div>
        )}

        {/* ADD FRIEND TAB */}
        {tab === 'add' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Add by email</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Send a friend request</div>
              </div>
              <span style={{ fontSize: 24 }}>👤</span>
            </div>
            <input
              className="form-input"
              type="email"
              placeholder="friend@email.com"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
              style={{ width: '100%', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <button
              className="btn-save"
              onClick={sendFriendRequest}
              style={{ marginBottom: 0 }}
            >
              Send Request
            </button>
          </div>
        )}

        {/* REQUESTS TAB */}
        {tab === 'requests' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                <span className="spinner" />
              </div>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 }}>
                No pending friend requests.
              </div>
            ) : (
              requests.map((req) => {
                const profile = req.profiles || {};
                return (
                  <div key={req.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'var(--accent)', color: '#0a0a0a',
                        fontWeight: 900, fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Syne, sans-serif', flexShrink: 0,
                      }}>
                        {(profile.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>{profile.username || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{profile.email || ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => respondToRequest(req.id, 'accept')}
                        className="btn-save"
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(req.id, 'decline')}
                        style={{
                          flex: 1, padding: '12px', border: '1px solid var(--border)',
                          borderRadius: 12, background: 'var(--surface2)',
                          color: 'var(--danger)', fontFamily: 'Syne, sans-serif',
                          fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* FRIENDS LIST TAB */}
        {tab === 'list' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                <span className="spinner" />
              </div>
            ) : friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 }}>
                You haven't added any friends yet.
              </div>
            ) : (
              friends.map((f) => {
                const profile = f.profiles || {};
                return (
                  <div key={f.friend_id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'var(--accent)', color: '#0a0a0a',
                        fontWeight: 900, fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Syne, sans-serif', flexShrink: 0,
                      }}>
                        {(profile.username || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>{profile.username || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{profile.email || ''}</div>
                      </div>
                      <button
                        onClick={() => removeFriend(f.friend_id)}
                        style={{
                          padding: '8px 14px', border: '1px solid var(--border)',
                          borderRadius: 10, background: 'var(--surface2)',
                          color: 'var(--danger)', fontFamily: 'Syne, sans-serif',
                          fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}