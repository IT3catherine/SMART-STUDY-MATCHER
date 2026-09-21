import React from "react";

/** Generic error display */
export default function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="card" style={{ borderColor: "#fecaca", background: "#fff1f2" }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>Error</div>
      <div className="small">{String(error.message || error)}</div>
    </div>
  );
}
