import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getUser, isAuthed, logout } from "../auth.js";
import { api, API_BASE_URL } from "../api.js";
import { io } from "socket.io-client";

function PillLink({ to, children, icon, badge }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 12, color: "white", textDecoration: "none", fontWeight: 600, transition: "all 0.2s", position: "relative" }} >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span>{children}</span>
      {badge > 0 && (
        <span style={{ position: "absolute", right: 12, background: "#e74c3c", color: "white", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 12, border: "2px solid #0f172a", animation: "pulse 2s infinite" }}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const nav = useNavigate();
  const authed = isAuthed();
  const user = getUser();
  const isAdmin = user?.role === "ADMIN";

  const [unreadConnections, setUnreadConnections] = useState(0);

  async function checkUnread() {
    if (!authed) return;
    try {
      const res = await api.get("/api/matches/me");
      const amt = (res.matches || []).reduce((acc, m) => acc + parseInt(m.unread_count || 0), 0);
      setUnreadConnections(amt);
    } catch(e) {}
  }

  useEffect(() => {
    if (!authed) return;
    checkUnread();

    const socket = io(API_BASE_URL, { withCredentials: true });
    socket.on("connect", () => console.log("Sidebar Socket Connected"));
    socket.on("NEW_MESSAGE", () => {
      checkUnread();
    });

    const interval = setInterval(checkUnread, 15000); // Polling fallback

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [authed]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a" }}>
      <div style={{ width: 280, flexShrink: 0, background: "linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", padding: "30px 20px", zIndex: 10 }}>
        <div style={{ padding: "0 10px", marginBottom: 40 }}>
          <div style={{ fontSize: 24, fontWeight: 900, background: "-webkit-linear-gradient(45deg, #4facfe, #00f2fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -0.5 }}>Study Matcher</div>
          {authed && <div style={{ marginTop: 8, display: "inline-block", padding: "4px 10px", background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: 10, fontSize: 12, fontWeight: 800 }}>MEMBER PORTAL</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {authed && (
            <>
              <PillLink to="/dashboard" icon="⚡">Dashboard</PillLink>
              <PillLink to="/profile" icon="👤">Identity</PillLink>
              <PillLink to="/units" icon="📚">Classes</PillLink>
              <PillLink to="/availability" icon="⏱️">Schedule</PillLink>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "10px 0" }} />
              <PillLink to="/matching" icon="🎯">Discovery</PillLink>
              <PillLink to="/requests" icon="📥">Inbox</PillLink>
              <PillLink to="/matches" icon="💬" badge={unreadConnections}>Connections</PillLink>
              <PillLink to="/sessions" icon="📅">Sessions</PillLink>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "10px 0" }} />
              <PillLink to="/notifications" icon="🔔">Alerts</PillLink>
              <PillLink to="/feedback" icon="⭐">Feedback</PillLink>
              <PillLink to="/blocks" icon="🛡️">Security</PillLink>
              {isAdmin && <PillLink to="/admin" icon="⚙️">Admin</PillLink>}
            </>
          )}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {!authed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn secondary" style={{ width: "100%", padding: "12px", borderRadius: 12, fontWeight: 800 }} onClick={() => nav("/login")}>System Login</button>
              <button className="btn" style={{ width: "100%", background: "linear-gradient(135deg, #4facfe, #00f2fe)", border: "none", color: "white", padding: "12px", borderRadius: 12, fontWeight: 900 }} onClick={() => nav("/register")}>Create Identity</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
              <div style={{ fontWeight: 700, color: "white", fontSize: 14 }}>{user?.name}</div>
              <button onClick={() => { logout(); nav("/login"); }} style={{ background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>Logout</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "40px" }}>
        <Outlet />
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
          100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
        }
        .sidebar-link:hover {
          background: rgba(255,255,255,0.05) !important;
          transform: translateX(4px);
        }
        .sidebar-link.active {
          background: linear-gradient(90deg, rgba(79, 172, 254, 0.15), transparent) !important;
          border-left: 4px solid #4facfe !important;
          color: #4facfe !important;
        }
      `}</style>
    </div>
  );
}
