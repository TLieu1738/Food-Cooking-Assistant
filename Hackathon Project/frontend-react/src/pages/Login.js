import { useState } from "react";

function Login({ navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        navigate("home");
      } else if (data.error) {
        alert("Login failed: " + data.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login error, see console.");
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;

export function Signup({ navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("SIGNUP RESPONSE:", data);

      if (data.user_id) {
        navigate('login');
      } else if (data.error) {
        alert("Signup failed: " + data.error);
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup error, see console.");
    }
  };

  return (
    <div>
      <h2>Signup</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export async function callProtectedRoute() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token stored. Log in first.");
    return;
  }

  try {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/protected`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("PROTECTED RESPONSE:", data);
  } catch (err) {
    console.error("Protected route error:", err);
  }
}