const { pool } = require("../config/db");

const profileRepo = {
  async getByUserId(userId) {
    const r = await pool.query("select * from student_profiles where user_id=$1", [userId]);
    return r.rows[0] || null;
  },

  async upsert(userId, data) {
    const r = await pool.query(
      `insert into student_profiles
       (user_id, program, year, learning_style, goals, bio, collaboration_mode, location, contact_pref, is_active)
       values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10)
       on conflict (user_id) do update set
       program=excluded.program,
       year=excluded.year,
       learning_style=excluded.learning_style,
       goals=excluded.goals,
       bio=excluded.bio,
       collaboration_mode=excluded.collaboration_mode,
       location=excluded.location,
       contact_pref=excluded.contact_pref,
       is_active=excluded.is_active
       returning *`,
      [
        userId,
        data.program,
        data.year,
        data.learning_style || null,
        JSON.stringify(data.goals || []),
        data.bio || null,
        data.collaboration_mode,
        data.location || null,
        data.contact_pref,
        data.is_active
      ]
    );
    return r.rows[0];
  }
};

module.exports = { profileRepo };
