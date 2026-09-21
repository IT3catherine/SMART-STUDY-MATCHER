import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";
import UnitPicker from "../components/UnitPicker.jsx";

/**
 * MatchingPage
 * - GET /api/enrollments/me
 * - GET /api/matching/for-unit/:unitId
 * - POST /api/requests
 */
export default function MatchingPage() {
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [busyRequestTo, setBusyRequestTo] = useState(null);

  const unitLabel = useMemo(() => {
    const x = enrollments.find((e) => e.unit_id === unitId);
    return x ? `${x.code} — ${x.name}` : "";
  }, [enrollments, unitId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const e = await api.get("/api/enrollments/me");
        if (!mounted) return;
        setEnrollments(e.enrollments || []);
        if ((e.enrollments || []).length && !unitId) setUnitId(e.enrollments[0].unit_id);
      } catch (e) {
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
  }, []);

  async function runMatch() {
    if (!unitId) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.get(`/api/matching/for-unit/${unitId}`);
      setResults(data.results || []);
    } catch (e) {
      if (e.message?.toLowerCase().includes("no available") || e.status === 404) {
        setResults([]); // Silent empty state fallback
      } else {
        setError(e); // Fatal server error
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (unitId) runMatch();
  }, [unitId]);

  return (
    <div className="container stack">
      <ErrorBox error={error} />

      <div className="card stack">
        <div style={{ fontSize: 18, fontWeight: 900 }}>Matching</div>
        <div className="muted">Choose a unit and browse ranked matches.</div>

        <div className="row two">
          <div>
            <div className="label">Unit</div>
            <UnitPicker enrollments={enrollments} value={unitId} onChange={setUnitId} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 10 }}>
            <button className="btn secondary" onClick={runMatch} disabled={busy || !unitId}>
              Refresh
            </button>
          </div>
        </div>

        {unitId && <div className="muted small">Results for: {unitLabel || unitId}</div>}
      </div>

      <div className="card stack">
        <div style={{ fontWeight: 900 }}>Top matches</div>

        {busy ? (
          <div className="muted">Matching...</div>
        ) : results.length === 0 ? (
          <div className="muted">No matches yet. Make sure others enrolled in the same unit and active.</div>
        ) : (
          <div className="gridList">
            {results.map((r) => (
              <div key={r.user_id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{r.name}</div>
                    <div className="muted small">
                      {r.program || "Program?"} {r.year ? `• Year ${r.year}` : ""}
                    </div>
                    <div className="muted small">Score: {Number(r.score).toFixed(3)}</div>
                  </div>

                  <div className="right">
                    <button
                      className="btn danger"
                      onClick={async () => {
                        try {
                          await api.post("/api/blocks", { blocked_user_id: r.user_id });
                          alert("User blocked successfully.");
                          runMatch(); // refresh list
                        } catch (e) {
                          alert(e.message || "Failed to block user");
                        }
                      }}
                    >
                      Block
                    </button>
                    <button
                      className="btn"
                      disabled={busyRequestTo === r.user_id}
                      onClick={async () => {
                        try {
                          setBusyRequestTo(r.user_id);
                          setError(null);
                          await api.post("/api/requests", { to_user_id: r.user_id, unit_id: unitId });
                          alert("Request sent");
                        } catch (e) {
                          setError(e);
                        } finally {
                          setBusyRequestTo(null);
                        }
                      }}
                    >
                      {busyRequestTo === r.user_id ? "Sending..." : "Send request"}
                    </button>
                  </div>
                </div>

                <div className="hr" />

                <div className="small" style={{ fontWeight: 900, marginBottom: 6 }}>Breakdown</div>
                <div className="muted small">
                  C {r.breakdown?.C?.toFixed?.(2)} • A {r.breakdown?.A?.toFixed?.(2)} • G {r.breakdown?.G?.toFixed?.(2)} • L {r.breakdown?.L?.toFixed?.(2)} • F {r.breakdown?.F?.toFixed?.(2)}
                </div>

                <div style={{ marginTop: 10 }}>
                  <div className="small" style={{ fontWeight: 900, marginBottom: 6 }}>Suggested times</div>
                  {!r.suggested_times || r.suggested_times.length === 0 ? (
                    <div className="muted small">No overlapping slots found.</div>
                  ) : (
                    <div>
                      {r.suggested_times.map((t, idx) => (
                        <span key={idx} className="badge">
                          D{t.day_of_week} {t.start_time}-{t.end_time} ({t.minutes}m)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
