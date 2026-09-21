import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { setAuth } from "../auth.js";
import ErrorBox from "../components/ErrorBox.jsx";

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin() {
    try {
      setBusy(true); setError(null);
      let fp = localStorage.getItem("study_matcher_fingerprint");
      if (!fp) fp = "u_dev_" + Math.random().toString(36).substring(2);

      const data = await api.post("/api/auth/login", { email, password, device_fingerprint: fp });
      localStorage.setItem("study_matcher_fingerprint", fp); // Save as trusted
      setAuth(data);
      nav(from);
    } catch(e) { setError(e); } finally { setBusy(false); }
  }

  return (
    <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div className="card stack" style={{ width: "100%", maxWidth: 460, margin: "0 auto", padding: 40, borderRadius: 24, background: "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: -0.5 }}>Secure Systems</div>
          <div className="muted" style={{ marginTop: 8 }}>Access your encrypted study environment.</div>
        </div>
        
        <ErrorBox error={error} />
        
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3", marginBottom: 8 }}>Active User Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", color: "white" }} />
          </div>
          
          <div>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3", marginBottom: 8 }}>Master Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", color: "white" }} />
          </div>
        </div>

        <button className="btn" disabled={busy} onClick={handleLogin} style={{ marginTop: 30, width: "100%", padding: "16px", background: "linear-gradient(135deg, #4facfe, #00f2fe)", border: "none", borderRadius: 12, color: "white", fontWeight: 900, fontSize: 16 }}>
          {busy ? "Authenticating Platform..." : "Initialize Session"}
        </button>

      </div>
    </div>
  );
}
