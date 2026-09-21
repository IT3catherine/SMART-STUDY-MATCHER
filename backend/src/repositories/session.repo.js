const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

/*
  Sessions are scheduled meetings between matched users.
*/
const sessionRepo = {
  async create({ match_id, created_by_user_id, starts_at, ends_at, mode, location_text, meeting_link }) {
    const id = randomUUID();
    const r = await pool.query(
      `insert into sessions
       (id, match_id, created_by_user_id, starts_at, ends_at, mode, location_text, meeting_link)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       returning *`,
      [id, match_id, created_by_user_id, starts_at, ends_at, mode, location_text || null, meeting_link || null]
    );
    return r.rows[0];
  },

  async listForUser(userId) {
    const r = await pool.query(
      `
      select s.*,
             m.user1_id, m.user2_id
      from sessions s
      join matches m on m.id = s.match_id
      where (m.user1_id=$1 or m.user2_id=$1)
      order by s.starts_at asc
      `,
      [userId]
    );
    return r.rows;
  },

  async listSessionsNeedingReminder(windowMinutes) {
    const r = await pool.query(
      `
      select
        s.id, s.starts_at,
        m.user1_id, m.user2_id,
        u1.name as user1_name,
        u2.name as user2_name
      from sessions s
      join matches m on m.id = s.match_id
      join users u1 on u1.id = m.user1_id
      join users u2 on u2.id = m.user2_id
      where s.reminder_sent_at is null
        and s.starts_at > now()
        and s.starts_at <= now() + ($1 || ' minutes')::interval
      `,
      [String(windowMinutes)]
    );
    return r.rows;
  },

  async markReminderSent(sessionId) {
    await pool.query("update sessions set reminder_sent_at=now() where id=$1", [sessionId]);
  },

  async deleteIfOwner({ session_id, acting_user_id }) {
    const r = await pool.query("select created_by_user_id from sessions where id=$1", [session_id]);
    const row = r.rows[0];
    if (!row) throw Object.assign(new Error("Session not found"), { status: 404 });
    if (row.created_by_user_id !== acting_user_id) throw Object.assign(new Error("Forbidden"), { status: 403 });

    await pool.query("delete from sessions where id=$1", [session_id]);
  }
};

module.exports = { sessionRepo };
