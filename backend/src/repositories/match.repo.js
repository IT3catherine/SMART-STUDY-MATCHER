const { pool } = require("../config/db");

/*
  Matches are created when a request is accepted.

  Contact reveal rule:
  - Only reveal emails to users who are part of that match (and match is active).
*/
const matchRepo = {
  async findById(matchId) {
    const r = await pool.query("select * from matches where id=$1", [matchId]);
    return r.rows[0] || null;
  },

  async listForUser(userId) {
    const r = await pool.query(
      `
      select
        m.*,
        case when m.user1_id=$1 then u2.name else u1.name end as other_name,
        case when m.user1_id=$1 then m.user2_id else m.user1_id end as other_user_id,
        un.code as unit_code,
        un.name as unit_name,
        case when m.user1_id=$1 then sp2.bio else sp1.bio end as other_bio,
        case when m.user1_id=$1 then sp2.program else sp1.program end as other_program,
        case when m.user1_id=$1 then sp2.learning_style else sp1.learning_style end as other_learning_style,
        (SELECT COUNT(*) FROM messages msg WHERE msg.match_id = m.id AND msg.sender_id != $1 AND msg.is_read = false) as unread_count
      from matches m
      join users u1 on u1.id = m.user1_id
      join users u2 on u2.id = m.user2_id
      left join units un on un.id = m.unit_id
      left join student_profiles sp1 on sp1.user_id = m.user1_id
      left join student_profiles sp2 on sp2.user_id = m.user2_id
      where (m.user1_id=$1 or m.user2_id=$1) and m.active=true
      order by m.created_at desc
      `,
      [userId]
    );
    return r.rows;
  },

  async getOtherUserContact({ match_id, acting_user_id }) {
    const r = await pool.query(
      `
      select
        m.id,
        m.user1_id, m.user2_id,
        u1.email as user1_email, u1.name as user1_name,
        u2.email as user2_email, u2.name as user2_name
      from matches m
      join users u1 on u1.id = m.user1_id
      join users u2 on u2.id = m.user2_id
      where m.id=$1 and m.active=true
      `,
      [match_id]
    );

    const row = r.rows[0];
    if (!row) throw Object.assign(new Error("Match not found"), { status: 404 });

    const isMember = row.user1_id === acting_user_id || row.user2_id === acting_user_id;
    if (!isMember) throw Object.assign(new Error("Forbidden"), { status: 403 });

    if (row.user1_id === acting_user_id) {
      return { other_user_id: row.user2_id, other_name: row.user2_name, other_email: row.user2_email };
    }
    return { other_user_id: row.user1_id, other_name: row.user1_name, other_email: row.user1_email };
  }
};

module.exports = { matchRepo };
