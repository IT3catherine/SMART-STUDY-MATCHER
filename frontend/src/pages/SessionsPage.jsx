import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

export default function SessionsPage() {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [matches, setMatches] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [matchId, setMatchId] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [mode, setMode] = useState("online");
  const [locationText, setLocationText] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const matchOptions = useMemo(() => matches || [], [matches]);

  async function load() {
    const m = await api.get("/api/matches/me");
    const s = await api.get("/api/sessions/me");
    setMatches(m.matches || []);
    setSessions(s.sessions || []);
    if (!matchId && (m.matches || []).length) setMatchId(m.matches[0].id);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try { await load(); } catch (e) { if (mounted) setError(e); }
    })();
    return () => (mounted = false);
  }, []);

  function toISO(localValue) {
    if (!localValue) return null;
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  return (
    <div className="container stack" style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      <ErrorBox error={error} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 30 }}>
        
        {/* Creation Panel */}
        <div className="card stack" style={{ padding: 40, borderRadius: 20, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", borderTop: "4px solid #f39c12", height: "fit-content" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>New Session</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Deploy a study appointment.</div>
          </div>

          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Partner</div>
            <select className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white" }} value={matchId} onChange={(e) => setMatchId(e.target.value)}>
              <option value="" disabled>Select match...</option>
              {matchOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.other_name}</option>
              ))}
            </select>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Start Boundary</div>
            <input className="input" type="datetime-local" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white" }} value={startsLocal} onChange={(e) => setStartsLocal(e.target.value)} />
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>End Boundary</div>
            <input className="input" type="datetime-local" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white" }} value={endsLocal} onChange={(e) => setEndsLocal(e.target.value)} />
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Mode</div>
            <select className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white" }} value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="online">Online</option>
              <option value="physical">Physical</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {mode !== "online" && (
            <div className="stack" style={{ gap: 8 }}>
              <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Location Context</div>
              <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white" }} value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Library / Room..." />
            </div>
          )}

          {mode !== "physical" && (
            <div className="stack" style={{ gap: 8 }}>
              <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Virtual Link</div>
              <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white" }} value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
          )}

          <button disabled={busy} style={{ marginTop: 20, background: "linear-gradient(135deg, #f39c12, #d35400)", color: "white", padding: "14px", borderRadius: 12, fontWeight: 900, boxShadow: "0 10px 20px rgba(243, 156, 18, 0.3)", border: "none", cursor: busy ? "not-allowed" : "pointer" }} onClick={async () => {
              try {
                setBusy(true); setError(null);
                const starts_at = toISO(startsLocal);
                const ends_at = toISO(endsLocal);
                if (!matchId) throw new Error("Pick a match first.");
                if (!starts_at || !ends_at) throw new Error("Provide valid start and end times.");
                await api.post("/api/sessions", { match_id: matchId, starts_at, ends_at, mode, location_text: mode === "online" ? null : locationText || null, meeting_link: mode === "physical" ? null : meetingLink || null });
                setLocationText(""); setMeetingLink(""); setStartsLocal(""); setEndsLocal("");
                await load();
                alert("Session Initialized!");
              } catch (e) { setError(e); } finally { setBusy(false); }
            }}>
            {busy ? "Deploying..." : "➕ Add Session"}
          </button>
        </div>

        {/* Master Details Panel */}
        <div className="card stack" style={{ padding: 40, borderRadius: 20, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: 12 }}><span style={{fontSize:40}}>📅</span> Scheduled Logistics</div>
            <div className="muted" style={{ fontSize: 16, marginTop: 8 }}>Your upcoming collaborative appointments.</div>
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 20, marginTop: 30, border: "2px dashed rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 50, opacity: 0.5, marginBottom: 16 }}>⏳</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>Calendar Empty</div>
              <div className="muted" style={{ marginTop: 8 }}>Schedule your first connection on the left panel.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 30 }}>
              {sessions.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", background: "rgba(255,255,255,0.02)", borderRadius: 16, borderLeft: "4px solid #f39c12", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
                  
                  <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                    <div style={{ background: "rgba(243,156,18,0.1)", color: "#f39c12", padding: "16px", borderRadius: 16, textAlign: "center", minWidth: 90 }}>
                       <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{new Date(s.starts_at).getDate()}</div>
                       <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>{new Date(s.starts_at).toLocaleString('default', { month: 'short' })}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{matchOptions.find(mo => mo.id === s.match_id)?.other_name || "Unknown Match"}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, marginTop: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>🕒 {new Date(s.starts_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} — {new Date(s.ends_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 8, fontSize: 11, letterSpacing: 1 }}>{s.mode.toUpperCase()}</span>
                      </div>
                      {(s.location_text || s.meeting_link) && (
                        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                          {s.location_text && <span style={{ fontSize: 13, background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: 20, color: "white" }}>📍 {s.location_text}</span>}
                          {s.meeting_link && <a href={s.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: 13, background: "rgba(52,152,219,0.2)", color: "#3498db", padding: "4px 12px", borderRadius: 20, textDecoration: "none", fontWeight: 800 }}>🌐 Join Virtual Link</a>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 20, borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                    <button onClick={async () => {
                          try { setError(null); await api.del(`/api/sessions/${s.id}`); await load(); } catch (e) { setError(e); }
                        }} style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c", padding: "10px 20px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}>
                      ✕ Terminate
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
