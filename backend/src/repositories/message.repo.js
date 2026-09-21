const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

const messageRepo = {
  async save({ match_id, sender_id, text }) {
    const id = randomUUID();
    const r = await pool.query(
      `insert into messages (id, match_id, sender_id, text)
       values ($1, $2, $3, $4)
       returning *`,
      [id, match_id, sender_id, text]
    );
    return r.rows[0];
  },

  async listForMatch(match_id) {
    const r = await pool.query(
      `select m.*, u.name as sender_name
       from messages m
       join users u on u.id = m.sender_id
       where m.match_id = $1
       order by m.created_at asc`,
      [match_id]
    );
    return r.rows;
  },

  async markRead(match_id, actingUserId) {
    await pool.query(
      `update messages set is_read=true where match_id=$1 and sender_id!=$2`,
      [match_id, actingUserId]
    );
  }
};

module.exports = { messageRepo };
