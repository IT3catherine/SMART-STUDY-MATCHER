import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_COLORS = ["#e74c3c", "#3498db", "#9b59b6", "#e67e22", "#f1c40f", "#1abc9c", "#34495e"];

function emptySlot() {
  return { day_of_week: 1, start_time: "18:00", end_time: "20:00" };
}

export default function AvailabilityPage() {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState([emptySlot()]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get("/api/availability/me");
        if (!mounted) return;
        setSlots((data.slots && data.slots.length) ? data.slots : [emptySlot()]);
      } catch (e) {
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <div className="container stack" style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
      <div className="card stack" style={{ padding: 40, borderRadius: 20, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", borderTop: "4px solid #1abc9c" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: 12 }}><span style={{fontSize:40}}>⏱️</span> Global Availability</div>
          <div className="muted" style={{ fontSize: 16, marginTop: 8 }}>Weekly temporal blocks utilized for match cross-referencing.</div>
        </div>

        <ErrorBox error={error} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
          {slots.map((s, idx) => {
            const hex = DAY_COLORS[s.day_of_week] || "#a8a8b3";
            return (
              <div key={idx} style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", borderLeft: `4px solid ${hex}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                
                <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1, minWidth: 400 }}>
                  <div className="stack" style={{ gap: 8, flex: 2 }}>
                    <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Temporal Axis</div>
                    <select className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white", fontWeight: 700 }} value={s.day_of_week} onChange={(e) => {
                        const v = Number(e.target.value);
                        setSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, day_of_week: v } : x)));
                      }}>
                      {DAYS.map((d, i) => (
                        <option key={d} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="stack" style={{ gap: 8, flex: 1 }}>
                    <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Start (24H)</div>
                    <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white", fontWeight: 700 }} value={s.start_time} onChange={(e) => setSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, start_time: e.target.value } : x)))} placeholder="18:00" />
                  </div>

                  <div className="stack" style={{ gap: 8, flex: 1 }}>
                    <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>End (24H)</div>
                    <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, color: "white", fontWeight: 700 }} value={s.end_time} onChange={(e) => setSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, end_time: e.target.value } : x)))} placeholder="20:00" />
                  </div>
                </div>

                <div style={{ paddingLeft: 20, borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => setSlots((prev) => prev.filter((_, i) => i !== idx))} disabled={slots.length === 1} style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c", padding: "12px 20px", borderRadius: 12, fontWeight: 900, cursor: slots.length === 1 ? "not-allowed" : "pointer", opacity: slots.length === 1 ? 0.3 : 1 }}>
                    ✕ Drop
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, paddingTop: 30, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button type="button" style={{ background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.3)", color: "white", padding: "12px 24px", borderRadius: 12, fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.1)"} onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.05)"} onClick={() => setSlots((prev) => [...prev, emptySlot()])}>
            + Inject Time Block
          </button>
          <button disabled={busy} style={{ background: "linear-gradient(135deg, #1abc9c, #16a085)", color: "white", padding: "14px 40px", fontSize: 16, borderRadius: 12, fontWeight: 900, boxShadow: "0 10px 20px rgba(26, 188, 156, 0.3)", border: "none", cursor: busy ? "not-allowed" : "pointer" }} onClick={async () => {
              try {
                setBusy(true); setError(null);
                await api.put("/api/availability/me", { slots });
                alert("Matrix Synchronized");
              } catch (e) { setError(e); } finally { setBusy(false); }
            }}>
            {busy ? "Synchronizing..." : "💾 Commit Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
