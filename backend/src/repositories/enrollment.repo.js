const { pool } = require("../config/db");

const enrollmentRepo = {
  async listMyEnrollments(userId) {
    const r = await pool.query(
      `select e.unit_id, e.semester, u.code, u.name, u.department
       from enrollments e
       join units u on u.id = e.unit_id
       where e.user_id=$1
       order by u.code asc`,
      [userId]
    );
    return r.rows;
  },

  async add({ user_id, unit_id, semester }) {
    const r = await pool.query(
      `insert into enrollments (user_id, unit_id, semester)
       values ($1,$2,$3)
       on conflict (user_id, unit_id) do update set semester=excluded.semester
       returning user_id, unit_id, semester`,
      [user_id, unit_id, semester]
    );
    return r.rows[0];
  },

  async remove({ user_id, unit_id }) {
    await pool.query("delete from enrollments where user_id=$1 and unit_id=$2", [user_id, unit_id]);
  }
};

module.exports = { enrollmentRepo };
