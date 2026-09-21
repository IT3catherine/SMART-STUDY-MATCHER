import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

export default function UnitsPage() {
  const [error, setError] = useState(null);
  const [units, setUnits] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [busyUnitId, setBusyUnitId] = useState(null);
  const [semester, setSemester] = useState("2026S1");

  const enrolledSet = useMemo(() => new Set(enrollments.map((e) => e.unit_id)), [enrollments]);

  async function load() {
    const u = await api.get("/api/units");
    const e = await api.get("/api/enrollments/me");
    setUnits(u.units || []);
    setEnrollments(e.enrollments || []);
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
    <div className="container stack" style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      <ErrorBox error={error} />
    
      <div className="card stack" style={{ padding: 40, borderRadius: 20, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", borderTop: "4px solid #a855f7" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "white", display: "flex", alignItems: "center", gap: 12 }}><span style={{fontSize:40}}>📚</span> Academic Curriculum</div>
          <div className="muted" style={{ fontSize: 16, marginTop: 8 }}>Register your active classes to calibrate the discovery matrix.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 30, marginTop: 20 }}>
          <div className="stack" style={{ gap: 8 }}>
            <div className="label" style={{ fontWeight: 800, color: "#a8a8b3" }}>Target Semester Label</div>
            <input className="input" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, color: "white" }} value={semester} onChange={(e) => setSemester(e.target.value)} />
            <div className="muted small">Persisted locally for grouping.</div>
          </div>
          <div className="stack" style={{ gap: 12, padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontWeight: 800, color: "white" }}>Your Active Enrollments</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {enrollments.length === 0 ? <div className="muted">You are completely unassigned.</div> : null}
              {enrollments.map((x) => (
                <div key={x.unit_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: 20, color: "white", fontWeight: 800, boxShadow: "0 4px 15px rgba(168,85,247,0.2)" }}>
                  {x.code}
                  <button style={{ background: "transparent", border: "none", color: "#a855f7", cursor: "pointer", fontWeight: 900, outline: "none" }} onClick={async () => {
                      setBusyUnitId(x.unit_id);
                      await api.del(`/api/enrollments/me/${x.unit_id}`);
                      await load();
                      setBusyUnitId(null);
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 20, marginTop: 20 }}>
        <div style={{ fontWeight: 900, fontSize: 24, paddingLeft: 10, color: "white" }}>Global Directory</div>

        {!units.length ? (
          <div style={{ padding: 40, textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 20 }}>
            <div style={{ fontSize: 40, opacity: 0.5, marginBottom: 10 }}>⚠️</div>
            <div className="muted">The master directory is vacant. Administrator must execute seed protocols.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {units.map((u) => {
              const enrolled = enrolledSet.has(u.id);
              return (
                <div key={u.id} style={{ padding: 20, background: enrolled ? "rgba(168, 85, 247, 0.05)" : "rgba(255,255,255,0.03)", borderRadius: 16, borderLeft: enrolled ? "4px solid #a855f7" : "4px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: 16, transition: "transform 0.2s, background 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: enrolled ? "#d946ef" : "white" }}>{u.code}</div>
                    <div style={{ fontWeight: 700, marginTop: 4 }}>{u.name}</div>
                    <div className="small" style={{ color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{u.department || "General Curriculum"}</div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
                    {enrolled ? (
                      <button className="btn danger" disabled={busyUnitId === u.id} onClick={async () => {
                          try {
                            setBusyUnitId(u.id); setError(null);
                            await api.del(`/api/enrollments/me/${u.id}`);
                            await load();
                          } catch(e) { setError(e); } finally { setBusyUnitId(null); }
                        }} style={{ padding: "8px 24px", borderRadius: 12, fontWeight: 800, background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid #e74c3c", cursor: busyUnitId === u.id ? "not-allowed" : "pointer" }}>
                        {busyUnitId === u.id ? "Voiding..." : "Unenroll"}
                      </button>
                    ) : (
                      <button className="btn" disabled={busyUnitId === u.id} onClick={async () => {
                          try {
                            setBusyUnitId(u.id); setError(null);
                            await api.post("/api/enrollments/me", { unit_id: u.id, semester });
                            await load();
                          } catch(e) { setError(e); } finally { setBusyUnitId(null); }
                        }} style={{ padding: "8px 24px", borderRadius: 12, fontWeight: 800, background: "transparent", color: "#a855f7", border: "1px solid #a855f7", cursor: busyUnitId === u.id ? "not-allowed" : "pointer" }}>
                        {busyUnitId === u.id ? "Syncing..." : "Register"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
