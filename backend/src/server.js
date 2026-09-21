require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const { createApp } = require("./app");
const { pool } = require("./config/db");
const { startReminderCron } = require("./jobs/reminderCron");
const { messageRepo } = require("./repositories/message.repo");

const PORT = process.env.PORT || 8080;

async function start() {
  const app = createApp();
  const server = http.createServer(app);

  const origins = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  origins.push("http://localhost:5173", "http://localhost:5174");

  const io = new Server(server, {
    cors: {
      origin: origins.includes("*") ? "*" : origins,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_match", (matchId) => {
      socket.join(matchId);
    });
    
    socket.on("send_message", async (data) => {
      try {
        const { match_id, sender_id, text, sender_name } = data;
        const msg = await messageRepo.save({ match_id, sender_id, text });
        msg.sender_name = sender_name; // Attach sender name for UI
        io.to(match_id).emit("receive_message", msg);

        try {
          const { notificationRepo } = require("./repositories/notification.repo");
          const matchRow = await pool.query("select user1_id, user2_id from matches where id=$1", [match_id]);
          const mRow = matchRow.rows[0];
          if (mRow) {
            const toUserId = mRow.user1_id === sender_id ? mRow.user2_id : mRow.user1_id;
            const room = io.sockets.adapter.rooms.get(match_id);
            const isUserInChat = room && room.size >= 2;

            if (!isUserInChat) {
              const recent = await pool.query(`select 1 from notifications where user_id=$1 and type='NEW_MESSAGE' and payload->>'from_user_id' = $2 and created_at > now() - interval '5 minutes'`, [toUserId, sender_id]);
              if (recent.rowCount === 0) {
                await notificationRepo.create({
                  user_id: toUserId,
                  type: "NEW_MESSAGE",
                  payload: { from_user_id: sender_id, from_user_name: sender_name, match_id }
                });
              }
            }
          }
        } catch (en) { console.error("Notification trigger error:", en); }

      } catch (e) {
        console.error("Socket send_message error:", e);
      }
    });
  });

  app.get("/health", async (req, res, next) => {
    try {
      const r = await pool.query("select 1 as ok");
      res.json({ ok: true, db: r.rows[0].ok });
    } catch (e) {
      next(e);
    }
  });

  startReminderCron();

  server.listen(PORT, () => {
    console.log(`API + Socket listening on :${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
