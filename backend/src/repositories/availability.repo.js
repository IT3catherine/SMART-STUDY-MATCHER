const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

const availabilityRepo = {
  async listForUser(userId) {
    const r = await pool.query(
      "select day_of_week,start_time,end_time from availability_slots where user_id=$1 order by day_of_week,start_time",
      [userId]
    );
    return r.rows;
  },

  async replaceForUser(userId, slots) {
    await pool.query("delete from availability_slots where user_id=$1", [userId]);

    for (const s of slots) {
      await pool.query(
        "insert into availability_slots (id,user_id,day_of_week,start_time,end_time) values ($1,$2,$3,$4,$5)",
        [randomUUID(), userId, s.day_of_week, s.start_time, s.end_time]
      );
    }
  }
};

module.exports = { availabilityRepo };
