import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { getUser } from "../auth.js";
import ErrorBox from "../components/ErrorBox.jsx";

/**
 * AdminPage (full dashboard)
 *
 * Requires role === ADMIN (UI check). Backend ALSO enforces role via middleware.
 *
 * Endpoints used:
 * - GET  /api/admin/analytics/summary
 * - GET  /api/admin/users?limit=&offset=&q=
 * - POST /api/admin/users/:id/active   { is_active: boolean }
 * - GET  /api/admin/events?limit=
 * - GET  /api/admin/moderation/feedback?limit=&offset=
 * - GET  /api/admin/moderation/requests?limit=&offset=
 * - GET  /api/admin/moderation/blocks?limit=&offset=
 */
export default function AdminPage() {
  const user = getUser();

  // UI tabs to avoid many pages for a student project
  const tabs = ["Summary", "Users", "Events", "Moderation"];
  const [tab, setTab] = useState("Summary");

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Summary
  const [summary, setSummary] = useState(null);

  // Users list state
  const [userQ, setUserQ] = useState("");
  const [userLimit, setUserLimit] = useState(25);
  const [userOffset, setUserOffset] = useState(0);
  const [usersOut, setUsersOut] = useState({ total: 0, users: [] });

  // Events list
  const [eventsLimit, setEventsLimit] = useState(80);
  const [events, setEvents] = useState([]);

  // Moderation state (3 lists)
  const modTabs = ["Feedback", "Requests", "Blocks"];
  const [modTab, setModTab] = useState("Feedback");
  const [modLimit, setModLimit] = useState(25);
  const [modOffset, setModOffset] = useState(0);
  const [modOut, setModOut] = useState({ total: 0 });

  const isAdmin = user?.role === "ADMIN";

  // ---------- loaders ----------
  async function loadSummary() {
    const r = await api.get("/api/admin/analytics/summary");
    setSummary(r.summary);
  }

  async function loadUsers({ limit = userLimit, offset = userOffset, q = userQ } = {}) {
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));
    if (q) qs.set("q", q);
    const r = await api.get(`/api/admin/users?${qs.toString()}`);
    setUsersOut(r);
  }

  async function loadEvents({ limit = eventsLimit } = {}) {
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    const r = await api.get(`/api/admin/events?${qs.toString()}`);
    setEvents(r.events || []);
  }

  async function loadModeration({ kind = modTab, limit = modLimit, offset = modOffset } = {}) {
    const endpoint =
      kind === "Feedback"
        ? "/api/admin/moderation/feedback"
        : kind === "Requests"
        ? "/api/admin/moderation/requests"
        : "/api/admin/moderation/blocks";

    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));
    const r = await api.get(`${endpoint}?${qs.toString()}`);
    setModOut(r);
  }

  // ---------- initial fetch ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isAdmin) return;
        setError(null);
        await loadSummary();
        await loadUsers({ limit: userLimit, offset: userOffset, q: "" });
        await loadEvents({ limit: eventsLimit });
        await loadModeration({ kind: modTab, limit: modLimit, offset: modOffset });
        if (!mounted) return;
      } catch (e) {
        if (mounted) setError(e);
      }
    })();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When switching moderation tab, reset paging (makes UI simpler)
  useEffect(() => {
    if (!isAdmin) return;
    setModOffset(0);
    (async () => {
      try {
        setError(null);
        await loadModeration({ kind: modTab, limit: modLimit, offset: 0 });
      } catch (e) {
        setError(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modTab]);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Users", value: summary.users },
      { label: "Profiles", value: summary.profiles },
      { label: "Active profiles", value: summary.active_profiles },
      { label: "Units", value: summary.units },
      { label: "Enrollments", value: summary.enrollments },
      { label: "Requests (pending)", value: `${summary.requests.pending} / ${summary.requests.total}` },
      { label: "Matches", value: summary.matches },
      { label: "Sessions (upcoming)", value: `${summary.sessions.upcoming} / ${summary.sessions.total}` },
      { label: "Feedback (avg)", value: `${summary.feedback.total} / ${Number(summary.feedback.avg_rating).toFixed(2)}` },
      { label: "Blocks", value: summary.blocks },
      { label: "Notifications", value: summary.notifications },
      { label: "Events", value: summary.events }
    ];
  }, [summary]);

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Admin</div>
          <div className="muted">You are not an admin.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container stack">
      <ErrorBox error={error} />

      <div className="card stack">
        <div style={{ fontSize: 18, fontWeight: 900 }}>Admin Dashboard</div>
        <div className="muted">Analytics, user activation, and moderation lists.</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t}
              className={`btn ${tab === t ? "" : "secondary"}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="right">
          <button
            className="btn secondary"
            disabled={busy}
            onClick={async () => {
              try {
                setBusy(true);
                setError(null);

                // Refresh only the visible tab to keep it fast
                if (tab === "Summary") await loadSummary();
                if (tab === "Users") await loadUsers({ limit: userLimit, offset: userOffset, q: userQ });
                if (tab === "Events") await loadEvents({ limit: eventsLimit });
                if (tab === "Moderation") await loadModeration({ kind: modTab, limit: modLimit, offset: modOffset });
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ------------------ SUMMARY TAB ------------------ */}
      {tab === "Summary" && (
        <div className="card stack">
          <div style={{ fontWeight: 900 }}>Summary</div>

          {!summary ? (
            <div className="muted">Loading summary...</div>
          ) : (
            <div className="row two">
              {summaryCards.map((c) => (
                <div key={c.label} className="card" style={{ padding: 12 }}>
                  <div className="muted small">{c.label}</div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{c.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------ USERS TAB ------------------ */}
      {tab === "Users" && (
        <div className="card stack">
          <div style={{ fontWeight: 900 }}>Users</div>
          <div className="muted">Search by name/email. Toggle profile active flag.</div>

          <div className="row two">
            <div>
              <div className="label">Search (q)</div>
              <input className="input" value={userQ} onChange={(e) => setUserQ(e.target.value)} placeholder="name or email..." />
            </div>
            <div className="row two">
              <div>
                <div className="label">Limit</div>
                <input className="input" type="number" value={userLimit} onChange={(e) => setUserLimit(Number(e.target.value || 25))} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      setError(null);
                      setUserOffset(0);
                      await loadUsers({ limit: userLimit, offset: 0, q: userQ });
                    } catch (e) {
                      setError(e);
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div className="muted small">
            Total: {usersOut.total} • Showing {usersOut.users?.length || 0} • Offset: {userOffset}
          </div>

          <div className="right">
            <button
              className="btn secondary"
              disabled={userOffset === 0}
              onClick={async () => {
                try {
                  const next = Math.max(0, userOffset - userLimit);
                  setUserOffset(next);
                  await loadUsers({ limit: userLimit, offset: next, q: userQ });
                } catch (e) {
                  setError(e);
                }
              }}
            >
              Prev
            </button>

            <button
              className="btn secondary"
              disabled={userOffset + userLimit >= usersOut.total}
              onClick={async () => {
                try {
                  const next = userOffset + userLimit;
                  setUserOffset(next);
                  await loadUsers({ limit: userLimit, offset: next, q: userQ });
                } catch (e) {
                  setError(e);
                }
              }}
            >
              Next
            </button>
          </div>

          {!usersOut.users || usersOut.users.length === 0 ? (
            <div className="muted">No users found.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Profile</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usersOut.users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{u.name}</div>
                      <div className="muted small">{u.email}</div>
                      <div className="muted small"><span className="code">{u.id}</span></div>
                    </td>
                    <td className="small">{u.role}</td>
                    <td className="small">
                      {u.program ? (
                        <>
                          <div>{u.program}</div>
                          <div className="muted small">Year {u.year}</div>
                          <div className="muted small">{u.learning_style || "no style"}</div>
                        </>
                      ) : (
                        <span className="muted">No profile</span>
                      )}
                    </td>
                    <td className="small">{u.is_active === null || u.is_active === undefined ? "—" : (u.is_active ? "Yes" : "No")}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn secondary"
                        disabled={u.role === "ADMIN" || u.is_active === null || u.is_active === undefined}
                        onClick={async () => {
                          try {
                            setError(null);
                            // Toggle active flag
                            const next = !u.is_active;
                            await api.post(`/api/admin/users/${u.id}/active`, { is_active: next });
                            await loadUsers({ limit: userLimit, offset: userOffset, q: userQ });
                          } catch (e) {
                            setError(e);
                          }
                        }}
                      >
                        Toggle active
                      </button>
                      <div className="muted small">
                        {u.role === "ADMIN" ? "Admins not toggled" : (u.is_active === null || u.is_active === undefined) ? "Profile required" : ""}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ------------------ EVENTS TAB ------------------ */}
      {tab === "Events" && (
        <div className="card stack">
          <div style={{ fontWeight: 900 }}>Events</div>
          <div className="muted">Simple audit log (latest first).</div>

          <div className="row two">
            <div>
              <div className="label">Limit</div>
              <input className="input" type="number" value={eventsLimit} onChange={(e) => setEventsLimit(Number(e.target.value || 80))} />
              <div className="muted small">Max 500 on backend.</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={async () => {
                  try {
                    setError(null);
                    await loadEvents({ limit: eventsLimit });
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Apply
              </button>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="muted">No events.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="small">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="small" style={{ fontWeight: 800 }}>{e.type}</td>
                    <td className="small">
                      {e.actor_name ? (
                        <>
                          <div>{e.actor_name}</div>
                          <div className="muted small">{e.actor_email}</div>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="small">
                      <div>{e.entity_type || "—"}</div>
                      <div className="muted small">{e.entity_id ? <span className="code">{e.entity_id}</span> : "—"}</div>
                    </td>
                    <td className="small">
                      <div className="muted small">{JSON.stringify(e.metadata || {})}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ------------------ MODERATION TAB ------------------ */}
      {tab === "Moderation" && (
        <div className="card stack">
          <div style={{ fontWeight: 900 }}>Moderation</div>
          <div className="muted">Read-only lists (feedback, requests, blocks).</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {modTabs.map((t) => (
              <button
                key={t}
                className={`btn ${modTab === t ? "" : "secondary"}`}
                onClick={() => setModTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="row two">
            <div>
              <div className="label">Limit</div>
              <input className="input" type="number" value={modLimit} onChange={(e) => setModLimit(Number(e.target.value || 25))} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={async () => {
                  try {
                    setError(null);
                    setModOffset(0);
                    await loadModeration({ kind: modTab, limit: modLimit, offset: 0 });
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                Apply
              </button>
            </div>
          </div>

          <div className="muted small">
            Total: {modOut.total || 0} • Offset: {modOffset}
          </div>

          <div className="right">
            <button
              className="btn secondary"
              disabled={modOffset === 0}
              onClick={async () => {
                try {
                  const next = Math.max(0, modOffset - modLimit);
                  setModOffset(next);
                  await loadModeration({ kind: modTab, limit: modLimit, offset: next });
                } catch (e) {
                  setError(e);
                }
              }}
            >
              Prev
            </button>

            <button
              className="btn secondary"
              disabled={modOffset + modLimit >= (modOut.total || 0)}
              onClick={async () => {
                try {
                  const next = modOffset + modLimit;
                  setModOffset(next);
                  await loadModeration({ kind: modTab, limit: modLimit, offset: next });
                } catch (e) {
                  setError(e);
                }
              }}
            >
              Next
            </button>
          </div>

          {/* Render the correct list depending on modTab */}
          {modTab === "Feedback" && (
            <>
              {!modOut.feedback || modOut.feedback.length === 0 ? (
                <div className="muted">No feedback items.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modOut.feedback.map((f) => (
                      <tr key={f.id}>
                        <td className="small">{new Date(f.created_at).toLocaleString()}</td>
                        <td className="small">
                          <div style={{ fontWeight: 800 }}>{f.from_name}</div>
                          <div className="muted small">{f.from_email}</div>
                        </td>
                        <td className="small">
                          <div style={{ fontWeight: 800 }}>{f.to_name}</div>
                          <div className="muted small">{f.to_email}</div>
                        </td>
                        <td className="small">{f.rating}</td>
                        <td className="small">{f.comment || <span className="muted">—</span>}</td>
                        <td className="small"><span className="code">{String(f.match_id).slice(0, 8)}…</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {modTab === "Requests" && (
            <>
              {!modOut.requests || modOut.requests.length === 0 ? (
                <div className="muted">No requests.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Unit</th>
                      <th>Status</th>
                      <th>Request ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modOut.requests.map((r) => (
                      <tr key={r.id}>
                        <td className="small">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="small">
                          <div style={{ fontWeight: 800 }}>{r.from_name}</div>
                          <div className="muted small">{r.from_email}</div>
                        </td>
                        <td className="small">
                          <div style={{ fontWeight: 800 }}>{r.to_name}</div>
                          <div className="muted small">{r.to_email}</div>
                        </td>
                        <td className="small">
                          <div style={{ fontWeight: 800 }}>{r.unit_code}</div>
                          <div className="muted small">{r.unit_name}</div>
                        </td>
                        <td className="small">{r.status}</td>
                        <td className="small"><span className="code">{String(r.id).slice(0, 8)}…</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {modTab === "Blocks" && (
            <>
              {!modOut.blocks || modOut.blocks.length === 0 ? (
                <div className="muted">No blocks.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Blocker</th>
                      <th>Blocked</th>
                      <th>IDs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modOut.blocks.map((b, idx) => (
                      <tr key={`${b.blocker_user_id}-${b.blocked_user_id}-${idx}`}>
                        <td className="small">{new Date(b.created_at).toLocaleString()}</td>
                        <td className="small">
                          <div style={{ fontWeight: 800 }}>{b.blocker_name}</div>
                          <div className="muted small">{b.blocker_email}</div>
                        </td>
                        <td className="small">
                          <div style={{ fontWeight: 800 }}>{b.blocked_name}</div>
                          <div className="muted small">{b.blocked_email}</div>
                        </td>
                        <td className="small">
                          <div className="muted small">blocker: <span className="code">{String(b.blocker_user_id).slice(0, 8)}…</span></div>
                          <div className="muted small">blocked: <span className="code">{String(b.blocked_user_id).slice(0, 8)}…</span></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
