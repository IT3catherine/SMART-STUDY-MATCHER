import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

export default function BlocksPage() {
  const [error, setError] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const b = await api.get("/api/blocks");
      setBlocks(b.blocks || []);
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUnblock(userId) {
    try {
      setBusy(true);
      setError(null);
      await api.del(`/api/blocks/${userId}`);
      await load();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container stack" style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      <div style={{ padding: "0 10px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 40 }}>🛡️</span> Blocked Connections
        </h2>
        <div className="muted" style={{ fontSize: 16, marginTop: 8 }}>
          Users you have permanently severed connections with.
        </div>
      </div>

      <ErrorBox error={error} />

      <div className="card stack" style={{ background: "rgba(255,255,255,0.02)", padding: 40, borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", borderTop: "4px solid #e74c3c" }}>
        {blocks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: 40, opacity: 0.5, marginBottom: 10 }}>📭</div>
            <div className="muted">You have no active blocks. Your directory is clear.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {blocks.map((b) => (
              <div key={b.blocked_user_id} style={{ padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid #e74c3c", borderTop: "1px solid rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flex: 1 }}>
                  
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    🚫
                  </div>

                  <div className="stack" style={{ gap: 4 }}>
                    <div style={{ fontWeight: 900, color: "white", fontSize: 20 }}>
                      {b.blocked_user_name || "Unknown Identity"}
                    </div>
                    
                    <div className="muted" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        {b.blocked_user_email}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      {b.blocked_user_program && (
                        <div style={{ fontSize: 12, background: "rgba(52, 152, 219, 0.1)", color: "#3498db", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>
                          🎓 {b.blocked_user_program}
                        </div>
                      )}
                      {b.blocked_user_units && (
                        <div style={{ fontSize: 12, background: "rgba(155, 89, 182, 0.1)", color: "#9b59b6", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>
                          📚 {b.blocked_user_units}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ paddingLeft: 20 }}>
                  <button className="btn secondary" disabled={busy} onClick={() => handleUnblock(b.blocked_user_id)} style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid #10b981", borderRadius: 10, padding: "10px 20px", fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
