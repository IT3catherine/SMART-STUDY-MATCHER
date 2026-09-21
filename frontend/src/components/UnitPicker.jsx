import React from "react";

/** Dropdown for enrolled units. */
export default function UnitPicker({ enrollments, value, onChange }) {
  return (
    <select className="input" value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>Select a unit...</option>
      {(enrollments || []).map((e) => (
        <option key={e.unit_id} value={e.unit_id}>
          {e.code} — {e.name}
        </option>
      ))}
    </select>
  );
}
