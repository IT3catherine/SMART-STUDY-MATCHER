import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

export default function ProfilePage() {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [program, setProgram] = useState("");
  const [year, setYear] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [goalsText, setGoalsText] = useState("exam, assignment");
  const [bio, setBio] = useState("");
  const [collabMode, setCollabMode] = useState("online");
  const [location, setLocation] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get("/api/profile/me");
        const p = data.profile;
        if (!mounted || !p) return;

        setProgram(p.program || "");
        setYear(p.year || "");
        setLearningStyle(p.learning_style || "");
        setGoalsText(Array.isArray(p.goals) ? p.goals.join(", ") : "exam, assignment");
        setBio(p.bio || "");
        setCollabMode(p.collaboration_mode || "online");
        setLocation(p.location || "");
        setIsActive(p.is_active !== false);
      } catch (e) {
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
  }, []);

  function parseGoals(text) {
    return text.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return (
    <div className="container stack" style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
      <div className="card stack" style={{ padding: 40, borderRadius: 20, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", borderTop: "4px solid #4facfe" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: 12 }}><span style={{fontSize:40}}>👤</span> Identity Configuration</div>
          <div className="muted" style={{ fontSize: 16, marginTop: 8 }}>Your matchmaking algorithms rely entirely on these core metrics.</div>
        </div>

        <ErrorBox error={error} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20 }}>
          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Degree / Program</div>
            <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white" }} value={program} onChange={(e) => setProgram(e.target.value)} placeholder="e.g. Computer Science" />
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Academic Year</div>
            <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white" }} value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 10 }}>
          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Learning Style Matrix</div>
            <select className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white" }} value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)}>
              <option value="">Undisclosed</option>
              <option value="visual">Visual (Diagrams & Charts)</option>
              <option value="auditory">Auditory (Lectures & Audio)</option>
              <option value="reading">Reading (Textbooks & Notes)</option>
              <option value="kinesthetic">Kinesthetic (Hands-on)</option>
            </select>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Preferred Mode</div>
            <select className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white" }} value={collabMode} onChange={(e) => setCollabMode(e.target.value)}>
              <option value="online">Strictly Online</option>
              <option value="physical">Strictly Physical</option>
              <option value="hybrid">Dynamic Hybrid</option>
            </select>
          </div>
        </div>

        <div className="stack" style={{ gap: 8, marginTop: 10 }}>
          <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Study Directives (Comma-separated)</div>
          <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white" }} value={goalsText} onChange={(e) => setGoalsText(e.target.value)} />
        </div>

        <div className="stack" style={{ gap: 8, marginTop: 10 }}>
          <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Biography & Experience</div>
          <textarea className="input" rows={4} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white", resize: "none" }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Introduce yourself..." />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 10, alignItems: "center" }}>
          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Physical Base Location</div>
            <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white" }} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Campus Area..." />
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", background: isActive ? "rgba(16,185,129,0.1)" : "rgba(231,76,60,0.1)", padding: "16px 20px", borderRadius: 16, border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "rgba(231,76,60,0.3)"}`, cursor: "pointer", transition: "all 0.2s" }} onClick={() => setIsActive(!isActive)}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: isActive ? "#10b981" : "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 900 }}>{isActive ? "✓" : "✕"}</div>
            <div>
              <div style={{ fontWeight: 900, color: isActive ? "#10b981" : "#e74c3c", fontSize: 16 }}>{isActive ? "Discovery Active" : "Discovery Offline"}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Click to toggle your global visibility.</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 30, paddingTop: 30, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button className="btn" disabled={busy} style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white", padding: "14px 32px", fontSize: 16, borderRadius: 12, fontWeight: 900, boxShadow: "0 10px 20px rgba(79, 172, 254, 0.3)", border: "none", cursor: busy ? "not-allowed" : "pointer" }} onClick={async () => {
              try {
                setBusy(true);
                setError(null);
                await api.put("/api/profile/me", {
                  program,
                  year,
                  learning_style: learningStyle || null,
                  goals: parseGoals(goalsText),
                  bio: bio || null,
                  collaboration_mode: collabMode,
                  location: location || null,
                  contact_pref: "email",
                  is_active: isActive
                });
                alert("Identity Synchronization Complete!");
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}>
            {busy ? "Encrypting..." : "💾 Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
