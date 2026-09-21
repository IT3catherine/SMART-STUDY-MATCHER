import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

/**
 * RequestsPage
 * - GET /api/requests/inbox
 * - GET /api/requests/sent
 * - POST /api/requests/:id/accept
 * - POST /api/requests/:id/decline
 */
export default function RequestsPage() {
  const [error, setError] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const a = await api.get("/api/requests/inbox");
    const b = await api.get("/api/requests/sent");
    setInbox(a.items || []);
    setSent(b.items || []);
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
    <div className="container stack" style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
      <ErrorBox error={error} />

      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: 2, textTransform: "uppercase", background: "linear-gradient(45deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Partnership Requests</h2>
        <div className="muted" style={{ marginTop: 8, fontSize: 16 }}>Review your incoming invitations and track your outgoing requests.</div>
      </div>

      <div className="row two" style={{ gap: 40 }}>
        {/* INBOX COLUMN */}
        <div className="stack" style={{ gap: 20 }}>
          <div style={{ padding: "12px 20px", background: "linear-gradient(90deg, rgba(79, 172, 254, 0.1) 0%, transparent 100%)", borderLeft: "4px solid #4facfe", fontSize: 18, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
            📥 Inbox ({inbox.length})
          </div>

          {inbox.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div className="muted">Your inbox is empty.</div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 16 }}>
              {inbox.map((r) => (
                <div key={r.id} style={{ padding: 20, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                  {/* Status Edge Ribbon */}
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: r.status === 'PENDING' ? '#f39c12' : r.status === 'ACCEPTED' ? '#10b981' : '#e74c3c' }} />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{r.from_name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{new Date(r.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>
                    <div style={{ padding: "4px 10px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, background: "rgba(255,255,255,0.05)", color: r.status === 'PENDING' ? '#f39c12' : r.status === 'ACCEPTED' ? '#10b981' : '#e74c3c' }}>
                      {r.status}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    {r.status === "PENDING" ? (
                      <>
                        <button
                          style={{ flex: 1, padding: "10px", background: "#10b981", color: "#fff", border: "none", fontWeight: 700, cursor: busyId ? "not-allowed" : "pointer", opacity: busyId === r.id ? 0.5 : 1, transition: "opacity 0.2s" }}
                          disabled={busyId === r.id}
                          onClick={async () => {
                            try {
                              setBusyId(r.id); setError(null);
                              await api.post(`/api/requests/${r.id}/accept`, {});
                              await load(); alert("Request Accepted! You can now chat in Matches.");
                            } catch (e) { setError(e); } finally { setBusyId(null); }
                          }}
                        >
                          ✓ ACCEPT
                        </button>
                        <button
                          style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, cursor: busyId ? "not-allowed" : "pointer", opacity: busyId === r.id ? 0.5 : 1 }}
                          disabled={busyId === r.id}
                          onClick={async () => {
                            try {
                              setBusyId(r.id); setError(null);
                              await api.post(`/api/requests/${r.id}/decline`, {});
                              await load();
                            } catch (e) { setError(e); } finally { setBusyId(null); }
                          }}
                        >
                          ✕ DECLINE
                        </button>
                      </>
                    ) : (
                      <button
                        style={{ width: "100%", padding: "10px", background: "rgba(231, 76, 60, 0.1)", border: "1px solid rgba(231, 76, 60, 0.3)", color: "#e74c3c", fontWeight: 700, cursor: busyId ? "not-allowed" : "pointer", opacity: busyId === r.id ? 0.5 : 1 }}
                        disabled={busyId === r.id}
                        onClick={async () => {
                          try {
                            setBusyId(r.id); setError(null);
                            await api.del(`/api/requests/${r.id}`);
                            await load();
                          } catch (e) { setError(e); } finally { setBusyId(null); }
                        }}
                      >
                        🗑️ DELETE RECORD
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SENT COLUMN */}
        <div className="stack" style={{ gap: 20 }}>
          <div style={{ padding: "12px 20px", background: "linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, transparent 100%)", borderLeft: "4px solid #a855f7", fontSize: 18, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
            📤 Sent ({sent.length})
          </div>

          {sent.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div className="muted">You haven't sent any requests.</div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 16 }}>
              {sent.map((r) => (
                <div key={r.id} style={{ padding: 20, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: r.status === 'PENDING' ? '#f39c12' : r.status === 'ACCEPTED' ? '#10b981' : '#e74c3c' }} />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{r.to_name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{new Date(r.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>
                    <div style={{ padding: "4px 10px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, background: "rgba(255,255,255,0.05)", color: r.status === 'PENDING' ? '#f39c12' : r.status === 'ACCEPTED' ? '#10b981' : '#e74c3c' }}>
                      {r.status}
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <button
                      style={{ width: "100%", padding: "10px", background: "rgba(231, 76, 60, 0.1)", border: "1px solid rgba(231, 76, 60, 0.3)", color: "#e74c3c", fontWeight: 700, cursor: busyId ? "not-allowed" : "pointer", opacity: busyId === r.id ? 0.5 : 1 }}
                      disabled={busyId === r.id}
                      onClick={async () => {
                        try {
                          setBusyId(r.id); setError(null);
                          await api.del(`/api/requests/${r.id}`);
                          await load();
                        } catch (e) { setError(e); } finally { setBusyId(null); }
                      }}
                    >
                      {r.status === "PENDING" ? "🚫 WITHDRAW" : "🗑️ DELETE"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
