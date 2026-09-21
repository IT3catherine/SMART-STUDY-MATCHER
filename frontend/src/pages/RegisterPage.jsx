import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { setAuth } from "../auth.js";
import ErrorBox from "../components/ErrorBox.jsx";

export default function RegisterPage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="container">
      <div className="card stack" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Register</div>
        <div className="muted">Create a student account.</div>

        <ErrorBox error={error} />

        <div>
          <div className="label">Name</div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>

        <div>
          <div className="label">Email</div>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" />
        </div>

        <div>
          <div className="label">Password (min 8 chars)</div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="right">
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              try {
                setBusy(true);
                setError(null);
                const data = await api.post("/api/auth/register", { name, email, password });
                setAuth(data);
                nav("/dashboard");
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Creating..." : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}
