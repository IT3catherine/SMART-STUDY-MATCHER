const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

const unitRepo = {
  async list() {
    const r = await pool.query("select * from units order by code asc");
    return r.rows;
  },

  async create({ code, name, department }) {
    const id = randomUUID();
    const r = await pool.query(
      "insert into units (id, code, name, department) values ($1,$2,$3,$4) returning *",
      [id, code, name, department || null]
    );
    return r.rows[0];
  },

  async findCandidatesForUnit(userId, unitId) {
    const r = await pool.query(
      `
      select u.id as user_id, u.name,
             1.0 as course_overlap
      from enrollments e
      join users u on u.id = e.user_id
      join student_profiles p on p.user_id = u.id and p.is_active = true
      where e.unit_id = $1
        and e.user_id <> $2
      `,
      [unitId, userId]
    );
    return r.rows;
  }
};

module.exports = { unitRepo };
