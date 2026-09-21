import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";
import ChatModal from "../components/ChatModal.jsx";
import { getUser } from "../auth.js";

export default function MatchesPage() {
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeChatMatch, setActiveChatMatch] = useState(null);
  
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const currentUser = getUser();

  async function load() {
    const [mRes, bRes] = await Promise.all([
      api.get("/api/matches/me"),
      api.get("/api/blocks").catch(() => ({ blocks: [] }))
    ]);
    setMatches(mRes.matches || []);
    setBlockedUsers(new Set((bRes.blocks || []).map(b => b.blocked_user_id)));
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

  return (
    <div className="container stack">
      <ErrorBox error={error} />

      <div className="card stack">
        <div style={{ fontSize: 18, fontWeight: 900 }}>Matches</div>
        <div className="muted">Chat with your study partners to coordinate sessions.</div>

        {matches.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: "40px 20px" }}>No matches yet. Keep exploring to find a study partner!</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginTop: 10 }}>
            {matches.map((m) => (
              <div key={m.id} className="card" style={{ padding: 20, borderRadius: 16, display: "flex", flexDirection: "column", gap: 12, borderTop: "4px solid #4facfe", boxShadow: "0 6px 20px rgba(0,0,0,0.15)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{m.other_name}</div>
                    <div style={{ color: "white", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", padding: "6px 14px", borderRadius: 8, marginTop: 8, display: "inline-block", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}>
                      {m.unit_code ? `🎓 ${m.unit_code} - ${m.unit_name}` : "🎓 General Study Session"}
                    </div>
                  </div>
                  <div style={{ fontSize: 24 }}>🤝</div>
                </div>

                {m.other_bio && (
                  <div style={{ marginTop: 8, fontSize: 14, fontStyle: "italic", opacity: 0.8, background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 8 }}>
                    "{m.other_bio}"
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 16 }}>
                  {blockedUsers.has(m.other_user_id) ? (
                    <button
                      className="btn"
                      style={{ padding: "8px 24px", background: "transparent", border: "1px solid #10b981", color: "#10b981", fontWeight: 900, width: "100%", borderRadius: 12, textTransform: "uppercase", letterSpacing: 1 }}
                      onClick={async () => {
                        try {
                          await api.del(`/api/blocks/${m.other_user_id}`);
                          alert("User unblocked! You can now chat with them.");
                          load();
                        } catch (e) {
                          alert(e.message || "Failed to unblock user");
                        }
                      }}
                    >
                      Restore Connection
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn secondary"
                        style={{ padding: "8px 16px", fontSize: 13, borderColor: "rgba(231, 76, 60, 0.3)", color: "#e74c3c", borderRadius: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(231,76,60,0.1)"; e.currentTarget.style.borderColor = "#e74c3c"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(231, 76, 60, 0.3)"; }}
                        onClick={async () => {
                          if (!window.confirm(`Are you sure you want to block ${m.other_name}?`)) return;
                          try {
                            await api.post("/api/blocks", { blocked_user_id: m.other_user_id });
                            alert("User blocked successfully. They are now restricted.");
                            if (activeChatMatch?.id === m.id) setActiveChatMatch(null);
                            load();
                          } catch (e) {
                            alert(e.message || "Failed to block user");
                          }
                        }}
                      >
                        Sever Ties
                      </button>
                      <button
                        className="btn"
                        style={{ padding: "8px 24px", background: "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)", border: "none", color: "white", fontWeight: 900, borderRadius: 12, position: "relative", textTransform: "uppercase", letterSpacing: 1 }}
                        onClick={() => { setActiveChatMatch(m); m.unread_count = 0; }}
                      >
                        Initialize Chat
                        {parseInt(m.unread_count || 0) > 0 && (
                          <span style={{ position: "absolute", top: -10, right: -10, background: "#e74c3c", color: "white", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 12, border: "2px solid #0f172a" }}>
                            {m.unread_count} New
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeChatMatch && currentUser && (
        <ChatModal 
          match={activeChatMatch} 
          currentUserId={currentUser.id} 
          onClose={() => setActiveChatMatch(null)} 
        />
      )}
    </div>
  );
}
