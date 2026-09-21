import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

/**
 * NotificationsPage
 * - GET /api/notifications/me
 */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const n = await api.get("/api/notifications/me");
    setItems(n.items || []);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
  }, []);

  function renderMessage(n) {
    const { type, payload } = n;
    switch (type) {
      case "REQUEST_RECEIVED":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span><strong>📥 New Request!</strong> {payload.from_user_name ? `${payload.from_user_name} sent you a study partner request` : "You received a study partner request"} for <strong style={{color:"#4facfe"}}>{payload.unit_name || payload.unit_code || "a class"}</strong>.</span>
            <button onClick={() => navigate("/requests")} style={{ padding: "6px 16px", background: "rgba(243, 156, 18, 0.2)", border: "1px solid #f39c12", color: "#f39c12", borderRadius: 8, fontWeight: "bold", width: "fit-content", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}>📥 Review in Inbox</button>
          </div>
        );
      case "REQUEST_ACCEPTED":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span><strong>🎉 Match Accepted!</strong> {payload.by_user_name ? `${payload.by_user_name} accepted your request` : "Someone accepted your request"} for <strong style={{color:"#10b981"}}>{payload.unit_name || payload.unit_code || "a class"}</strong>!</span>
            <button onClick={() => navigate("/matches")} style={{ padding: "6px 16px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", color: "#10b981", borderRadius: 8, fontWeight: "bold", width: "fit-content", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}>💬 View Match</button>
          </div>
        );
      case "NEW_MESSAGE":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span><strong>💬 New Message!</strong> You have a new message from <strong style={{color: "#a855f7"}}>{payload.from_user_name || "your study partner"}</strong>!</span>
            <button onClick={() => navigate("/matches")} style={{ padding: "6px 16px", background: "rgba(168, 85, 247, 0.2)", border: "1px solid #a855f7", color: "#d946ef", borderRadius: 8, fontWeight: "bold", width: "fit-content", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}>💬 Hop into Chat</button>
          </div>
        );
      case "UPCOMING_SESSION":
        return (
          <>
            <strong>⏰ Upcoming Session:</strong> You have a study session starting soon! Be prepared.
          </>
        );
      default:
        // Fallback for unknown types (hiding UUIDs)
        return <span><strong>🔔 Notice:</strong> {payload?.message || "A new event occurred on your account."}</span>;
    }
  }

  function getCardStyle(type) {
    const base = { padding: 20, borderRadius: 12, marginBottom: 12, transition: "transform 0.2s", display: "flex", flexDirection: "column", gap: 8 };
    if (type === "REQUEST_ACCEPTED") {
      return { ...base, background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white", boxShadow: "0 4px 15px rgba(42, 82, 152, 0.4)" };
    }
    if (type === "REQUEST_RECEIVED") {
      return { ...base, background: "linear-gradient(135deg, #232526 0%, #414345 100%)", color: "white", borderLeft: "4px solid #f39c12" };
    }
    return { ...base, borderLeft: "4px solid var(--primary)" };
  }

  return (
    <div className="container stack" style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <ErrorBox error={error} />

      <div className="stack" style={{ gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, background: "-webkit-linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Notifications
          </h2>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={async () => {
              try {
                setBusy(true);
                setError(null);
                await load();
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
            style={{ borderRadius: 20, padding: "8px 16px", fontWeight: "bold" }}
          >
            {busy ? "Refreshing..." : "Refresh ⟳"}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div className="muted" style={{ fontSize: 16 }}>You are all caught up! No new notifications.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((n) => (
              <div key={n.id} className="card" style={getCardStyle(n.type)} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                <div style={{ fontSize: 16, lineHeight: 1.5 }}>
                  {renderMessage(n)}
                </div>
                <div className="muted small" style={{ opacity: 0.7, marginTop: 4, fontWeight: 500 }}>
                  {new Date(n.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
