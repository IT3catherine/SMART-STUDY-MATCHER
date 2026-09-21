const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

const feedbackRepo = {
  async create({ from_user_id, to_user_id, match_id, rating, comment }) {
    const id = randomUUID();
    const r = await pool.query(
      `insert into feedback (id, from_user_id, to_user_id, match_id, rating, comment)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [id, from_user_id, to_user_id, match_id, rating, comment || null]
    );
    return r.rows[0];
  },

  async getReputationScore(userId) {
    const r = await pool.query(
      "select coalesce(avg(rating), 3)::float as avg_rating from feedback where to_user_id=$1",
      [userId]
    );
    const avg = r.rows[0]?.avg_rating || 3;
    return Math.max(0, Math.min(1, avg / 5));
  }
};

module.exports = { feedbackRepo };
