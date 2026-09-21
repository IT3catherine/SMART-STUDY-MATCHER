const { pool } = require("../config/db");

/*
  Blocks are mutual-exclusion constraints used by matching and requests.
  If A blocks B, we exclude both ways for safety.
*/
const blockRepo = {
  async block({ blocker_user_id, blocked_user_id }) {
    await pool.query(
      `insert into blocks (blocker_user_id, blocked_user_id)
       values ($1,$2)
       on conflict (blocker_user_id, blocked_user_id) do nothing`,
      [blocker_user_id, blocked_user_id]
    );
  },

  async unblock({ blocker_user_id, blocked_user_id }) {
    await pool.query(
      "delete from blocks where blocker_user_id=$1 and blocked_user_id=$2",
      [blocker_user_id, blocked_user_id]
    );
  },

  async isBlockedEitherWay(a, b) {
    const r = await pool.query(
      `select 1 as yes
       from blocks
       where (blocker_user_id=$1 and blocked_user_id=$2)
          or (blocker_user_id=$2 and blocked_user_id=$1)
       limit 1`,
      [a, b]
    );
    return (r.rows[0]?.yes || 0) === 1;
  },

  async listBlockedUsers(blocker_user_id) {
    const r = await pool.query(
      `select 
         b.blocked_user_id, 
         u.name as blocked_user_name,
         u.email as blocked_user_email,
         p.program as blocked_user_program,
         (
           select string_agg(un.name, ', ')
           from enrollments e
           join units un on un.id = e.unit_id
           where e.user_id = b.blocked_user_id
         ) as blocked_user_units
       from blocks b
       join users u on u.id = b.blocked_user_id
       left join student_profiles p on p.user_id = b.blocked_user_id
       where b.blocker_user_id = $1`,
      [blocker_user_id]
    );
    return r.rows;
  }
};

module.exports = { blockRepo };
