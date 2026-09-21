const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

const notificationRepo = {
  async create({ user_id, type, payload }) {
    await pool.query(
      "insert into notifications (id, user_id, type, payload) values ($1,$2,$3,$4)",
      [randomUUID(), user_id, type, JSON.stringify(payload || {})]
    );
  },

  async listForUser(userId) {
    const r = await pool.query(
      "select * from notifications where user_id=$1 order by created_at desc limit 50",
      [userId]
    );
    return r.rows;
  }
};

module.exports = { notificationRepo };
