import { useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function Friends({ token }) {
  const [friendEmail, setFriendEmail] = useState("");
  const [message, setMessage] = useState("");

  async function sendFriendRequest() {
    try {
      const res = await fetch(`${BACKEND}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ email: friendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Friend request sent ✅");
        setFriendEmail("");
      } else {
        setMessage(data.error || "Failed to send request");
      }
    } catch {
      setMessage("Server error");
    }
  }

  // eslint-disable-next-line no-unused-vars
  async function acceptFriendRequest(requestId) {
    try {
      const res = await fetch(`${BACKEND}/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ request_id: requestId }),
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

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Add Friend</h3>
      <input
        type="email"
        placeholder="Friend email"
        value={friendEmail}
        onChange={(e) => setFriendEmail(e.target.value)}
      />
      <button onClick={sendFriendRequest}>Send Friend Request</button>
      {message && <p>{message}</p>}
    </div>
  );
}