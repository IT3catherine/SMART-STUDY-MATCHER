import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import ErrorBox from "../components/ErrorBox.jsx";

/**
 * FeedbackPage
 * - GET /api/matches/me (to pick a match)
 * - GET /api/matches/:id/contact (to get the other_user_id)
 * - POST /api/feedback  { to_user_id, match_id, rating, comment }
 *
 * Backend requires to_user_id and match_id, so we resolve to_user_id via contact endpoint.
 */
export default function FeedbackPage() {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [matches, setMatches] = useState([]);
  const [matchId, setMatchId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const selectedMatch = useMemo(() => matches.find((m) => m.id === matchId) || null, [matches, matchId]);

  async function loadMatches() {
    const m = await api.get("/api/matches/me");
    setMatches(m.matches || []);
    if (!matchId && (m.matches || []).length) setMatchId(m.matches[0].id);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadMatches();
      } catch (e) {
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
  }, []);

  // When match changes, fetch the other user's id via contact endpoint
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setToUserId("");
        if (!matchId) return;
        const c = await api.get(`/api/matches/${matchId}/contact`);
        if (!mounted) return;
        setToUserId(c.contact?.other_user_id || "");
      } catch (e) {
        // If contact reveal fails, feedback will fail too. Show the error.
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
  }, [matchId]);

  return (
    <div className="container stack" style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <div className="card stack" style={{ padding: 40, borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%)", borderTop: "4px solid #f1c40f" }}>
        
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 50, marginBottom: 10, animation: "bounce 2s infinite" }}>✨</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, background: "-webkit-linear-gradient(45deg, #f1c40f 0%, #e67e22 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            Session Feedback
          </h2>
          <div className="muted" style={{ marginTop: 8 }}>Help us improve your future matches!</div>
        </div>

        <ErrorBox error={error} />

        <div className="stack" style={{ gap: 24, marginTop: 10 }}>
          
          {/* Match Selection */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#f1c40f", textTransform: "uppercase", letterSpacing: 1 }}>Select Study Partner</label>
            <select 
              className="input" 
              value={matchId} 
              onChange={(e) => setMatchId(e.target.value)}
              style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, borderRadius: 12, fontSize: 16, color: "white" }}
            >
              <option value="" disabled>Choose someone...</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>{m.other_name} {m.unit_code ? `(${m.unit_code})` : ""}</option>
              ))}
            </select>
          </div>

          {/* Custom Star Rating */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", background: "rgba(0,0,0,0.1)", padding: 20, borderRadius: 12 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#f1c40f", textTransform: "uppercase", letterSpacing: 1 }}>How was the session?</label>
            <div style={{ display: 'flex', gap: 12, fontSize: 40, cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    color: star <= rating ? '#f1c40f' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                    textShadow: star <= rating ? '0 0 20px rgba(241,196,15,0.6)' : 'none',
                    transform: star <= rating ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="muted small">{rating === 5 ? "Amazing!" : rating === 4 ? "Great" : rating === 3 ? "Okay" : rating === 2 ? "Not great" : "Poor"}</div>
          </div>

          {/* Comment Box */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: "#f1c40f", textTransform: "uppercase", letterSpacing: 1 }}>Additional Comments</label>
            <textarea 
              className="input" 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="What went well? What could be better?" 
              style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", padding: 16, borderRadius: 12, fontSize: 15, color: "white", minHeight: 100, resize: "vertical" }}
            />
          </div>

          {/* Submit Button */}
          <button
            className="btn"
            disabled={busy}
            style={{ padding: "16px 20px", marginTop: 10, background: "linear-gradient(45deg, #f1c40f 0%, #e67e22 100%)", border: "none", color: "white", fontWeight: 900, fontSize: 16, borderRadius: 12, boxShadow: "0 4px 15px rgba(241, 196, 15, 0.4)", cursor: busy ? "not-allowed" : "pointer" }}
            onClick={async () => {
              try {
                setBusy(true);
                setError(null);

                if (!matchId) throw new Error("Please select a study partner to review.");
                if (!toUserId) throw new Error("Loading user information... Please wait or try refreshing.");

                await api.post("/api/feedback", {
                  to_user_id: toUserId,
                  match_id: matchId,
                  rating,
                  comment: comment || null
                });

                setComment("");
                setRating(5);
                alert("Thank you! Your feedback has been submitted successfully. 💖");
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Submitting..." : "Submit Feedback 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
