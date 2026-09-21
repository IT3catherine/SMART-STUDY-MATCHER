import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await api.get("/api/profile/me");
        const e = await api.get("/api/enrollments/me");
        const n = await api.get("/api/notifications/me");
        if (!mounted) return;
        setProfile(p.profile);
        setEnrollments(e.enrollments || []);
        setNotifications(n.items || []);
      } catch (e) {
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
  }, []);

  function getNotificationAction(n) {
    if (n.type === "REQUEST_RECEIVED") return { label: "📥 View Request", path: "/requests", color: "#f39c12" };
    if (n.type === "REQUEST_ACCEPTED" || n.type === "NEW_MESSAGE") return { label: "💬 Open Chat", path: "/matches", color: "#10b981" };
    return null;
  }

  return (
    <div className="container stack" style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
        <div>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, background: "-webkit-linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Welcome back, {profile?.user?.name || "Student"}! 🚀
          </h2>
          <div className="muted" style={{ fontSize: 16, marginTop: 4 }}>Here is your study environment at a glance.</div>
        </div>
      </div>

      <ErrorBox error={error} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div className="stack" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 24, borderRadius: 20, background: "rgba(255,255,255,0.02)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", borderTop: "4px solid #4facfe" }}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>👤</span> Identity
            </div>
            {!profile ? (
              <div className="muted">No profile configured yet. Please update your settings.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ background: "rgba(79, 172, 254, 0.1)", color: "#4facfe", padding: "6px 12px", borderRadius: 12, fontWeight: 700, fontSize: 13 }}>🏛️ {profile.program}</span>
                  <span style={{ background: "rgba(243, 156, 18, 0.1)", color: "#f39c12", padding: "6px 12px", borderRadius: 12, fontWeight: 700, fontSize: 13 }}>📅 Year {profile.year}</span>
                  {profile.learning_style && <span style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7", padding: "6px 12px", borderRadius: 12, fontWeight: 700, fontSize: 13 }}>🧠 {profile.learning_style}</span>}
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600, color: "white" }}>Match Discovery</div>
                  <div style={{ color: profile.is_active ? "#10b981" : "#e74c3c", fontWeight: 900, fontSize: 14 }}>
                    {profile.is_active ? "🟢 ACTIVE" : "🔴 OFFLINE"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24, borderRadius: 20, background: "rgba(255,255,255,0.02)", borderTop: "4px solid #a855f7", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
             <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>📚</span> Active Classes
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {enrollments.length === 0 ? <div className="muted">No enrolled dependencies.</div> : null}
              {enrollments.map(e => (
                <div key={e.unit_id} style={{ padding: "8px 14px", background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14 }}>
                  {e.code}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card stack" style={{ padding: 24, borderRadius: 20, background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%)", borderTop: "4px solid #10b981", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24 }}>⚡</span> Activity Feed
          </div>
          
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, opacity: 0.5 }}>📭</div>
              <div className="muted" style={{ marginTop: 10 }}>No recent platform activity.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.slice(0, 5).map((n) => {
                const action = getNotificationAction(n);
                return (
                  <div key={n.id} style={{ padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
                    <div>
                      <div style={{ fontWeight: 800, color: "white", fontSize: 15 }}>
                        {n.type === "REQUEST_RECEIVED" && "📥 New Request"}
                        {n.type === "REQUEST_ACCEPTED" && "🎉 Match Accepted"}
                        {n.type === "NEW_MESSAGE" && "💬 Chat Activity"}
                        {!["REQUEST_RECEIVED", "REQUEST_ACCEPTED", "NEW_MESSAGE"].includes(n.type) && n.type}
                      </div>
                      <div className="muted small" style={{ marginTop: 4 }}>
                        {n.payload?.unit_code ? `Regarding ${n.payload.unit_code}` : "A new event occurred."}
                      </div>
                    </div>
                    {action && (
                      <button 
                        onClick={() => navigate(action.path)}
                        style={{ padding: "6px 14px", background: `rgba(${action.color === '#f39c12' ? '243,156,18' : '16,185,129'}, 0.2)`, border: `1px solid ${action.color}`, color: action.color, borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer" }}
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                );
              })}
              <button className="btn secondary" style={{ marginTop: 10, borderRadius: 12, padding: 10 }} onClick={() => navigate("/notifications")}>
                View All Notifications →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
