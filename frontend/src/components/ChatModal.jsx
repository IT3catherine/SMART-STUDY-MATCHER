import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { api, API_BASE_URL } from "../api.js";

export default function ChatModal({ match, onClose, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    api.post(`/api/messages/${match.id}/read`).catch(console.error);

    api.get(`/api/messages/${match.id}`).then((res) => {
      if (!mounted) return;
      setMessages(res.messages || []);
      scrollToBottom();
    }).catch(console.error);

    const socket = io(API_BASE_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.emit("join_match", match.id);

    socket.on("receive_message", (msg) => {
      if (!mounted) return;
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [match.id]);

  function scrollToBottom() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    
    socketRef.current.emit("send_message", {
      match_id: match.id,
      sender_id: currentUserId,
      text: text.trim(),
      sender_name: "Me" // Server/UI can handle actual names, 'Me' is fine for immediate display
    });
    setText("");
  }

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, width: 380, height: 500,
      background: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(12px)", 
      border: "1px solid rgba(255,255,255,0.15)", borderRadius: 24,
      boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 20px rgba(59, 130, 246, 0.15)", 
      display: "flex", flexDirection: "column", zIndex: 1000, overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ 
        padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", 
        background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 10px rgba(79, 172, 254, 0.4)" }}>
            🎓
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "white", letterSpacing: 0.5 }}>
              {match.other_name}
              {match.unit_code && <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", background: "rgba(255,255,255,0.1)", borderRadius: 12 }}>{match.unit_code}</span>}
            </div>
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: "#10b981" }} /> Online
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", width: 32, height: 32, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 40, opacity: 0.8 }}>👋</div>
            <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>Be the first to say hi!</div>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId;
          return (
            <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              <div style={{
                background: isMe ? "linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)" : "rgba(255,255,255,0.1)",
                padding: "10px 16px", borderRadius: 20, 
                borderBottomRightRadius: isMe ? 4 : 20, borderBottomLeftRadius: !isMe ? 4 : 20,
                fontSize: 15, color: "white", wordBreak: "break-word",
                boxShadow: isMe ? "0 4px 15px rgba(0, 114, 255, 0.3)" : "none"
              }}>
                {m.text}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMe && <span style={{ color: "#4facfe", fontSize: 12 }}>✓✓</span>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ padding: "16px 20px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 12 }}>
        <input
          autoFocus
          style={{ flex: 1, padding: "12px 20px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 15, outline: "none", transition: "border 0.2s" }}
          onFocus={e => e.target.style.borderColor = "#4facfe"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim()} style={{ background: text.trim() ? "linear-gradient(135deg, #4facfe, #00f2fe)" : "rgba(255,255,255,0.1)", border: "none", width: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, cursor: text.trim() ? "pointer" : "default", opacity: text.trim() ? 1 : 0.5, transition: "transform 0.2s", boxShadow: text.trim() ? "0 4px 10px rgba(0,242,254,0.3)" : "none" }} onMouseDown={e => { if (text.trim()) e.currentTarget.style.transform = "scale(0.9)" }} onMouseUp={e => { if (text.trim()) e.currentTarget.style.transform = "scale(1)" }}>
          ➤
        </button>
      </form>
    </div>
  );
}
