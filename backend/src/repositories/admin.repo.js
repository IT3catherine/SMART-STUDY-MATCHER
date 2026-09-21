const { pool } = require("../config/db");

/**
 * Admin repository:
 * - analytics summary
 * - users list
 * - active flag update
 * - event log list
 * - moderation lists for feedback/requests/blocks
 */
const adminRepo = {
  async analyticsSummary() {
    const q = async (sql, params = []) => (await pool.query(sql, params)).rows[0];

    const users = await q("select count(*)::int as n from users");
    const profiles = await q("select count(*)::int as n from student_profiles");
    const active_profiles = await q("select count(*)::int as n from student_profiles where is_active=true");
    const units = await q("select count(*)::int as n from units");
    const enrollments = await q("select count(*)::int as n from enrollments");
    const requests_total = await q("select count(*)::int as n from match_requests");
    const requests_pending = await q("select count(*)::int as n from match_requests where status='PENDING'");
    const requests_accepted = await q("select count(*)::int as n from match_requests where status='ACCEPTED'");
    const requests_declined = await q("select count(*)::int as n from match_requests where status='DECLINED'");
    const matches = await q("select count(*)::int as n from matches where active=true");
    const sessions = await q("select count(*)::int as n from sessions");
    const upcoming_sessions = await q("select count(*)::int as n from sessions where starts_at > now()");
    const feedback = await q("select count(*)::int as n from feedback");
    const avg_rating = await q("select coalesce(avg(rating),0)::float as v from feedback");
    const blocks = await q("select count(*)::int as n from blocks");
    const notifications = await q("select count(*)::int as n from notifications");
    const events = await q("select count(*)::int as n from events");

    return {
      users: users.n,
      profiles: profiles.n,
      active_profiles: active_profiles.n,
      units: units.n,
      enrollments: enrollments.n,
      requests: {
        total: requests_total.n,
        pending: requests_pending.n,
        accepted: requests_accepted.n,
        declined: requests_declined.n
      },
      matches: matches.n,
      sessions: { total: sessions.n, upcoming: upcoming_sessions.n },
      feedback: { total: feedback.n, avg_rating: avg_rating.v },
      blocks: blocks.n,
      notifications: notifications.n,
      events: events.n
    };
  },

  async listUsers({ limit, offset, q }) {
    const params = [];
    let where = "";
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where = "where lower(u.name) like $1 or lower(u.email) like $1";
    }
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const rows = await pool.query(
      `
      select
        u.id, u.name, u.email, u.role, u.created_at,
        p.program, p.year, p.learning_style, p.is_active
      from users u
      left join student_profiles p on p.user_id = u.id
      ${where}
      order by u.created_at desc
      limit $${limitParam} offset $${offsetParam}
      `,
      [...params, limit, offset]
    );

    const totalRes = await pool.query(
      `select count(*)::int as n
       from users u
       ${where}`,
      params
    );

    return { total: totalRes.rows[0].n, limit, offset, users: rows.rows };
  },

  async setUserActive({ userId, is_active }) {
    const r = await pool.query(
      "update student_profiles set is_active=$2 where user_id=$1 returning *",
      [userId, is_active]
    );
    if (!r.rows[0]) throw Object.assign(new Error("Profile not found for this user"), { status: 404 });
    return r.rows[0];
  },

  async listEvents({ limit }) {
    const r = await pool.query(
      `
      select e.*, u.name as actor_name, u.email as actor_email
      from events e
      left join users u on u.id = e.actor_user_id
      order by e.created_at desc
      limit $1
      `,
      [limit]
    );
    return r.rows;
  },

  async listFeedback({ limit, offset }) {
    const r = await pool.query(
      `
      select
        f.*,
        u_from.name as from_name, u_from.email as from_email,
        u_to.name as to_name, u_to.email as to_email
      from feedback f
      join users u_from on u_from.id = f.from_user_id
      join users u_to on u_to.id = f.to_user_id
      order by f.created_at desc
      limit $1 offset $2
      `,
      [limit, offset]
    );

    const totalRes = await pool.query("select count(*)::int as n from feedback");
    return { total: totalRes.rows[0].n, limit, offset, feedback: r.rows };
  },

  async listRequests({ limit, offset }) {
    const r = await pool.query(
      `
      select
        mr.*,
        uf.name as from_name, uf.email as from_email,
        ut.name as to_name, ut.email as to_email,
        un.code as unit_code, un.name as unit_name
      from match_requests mr
      join users uf on uf.id = mr.from_user_id
      join users ut on ut.id = mr.to_user_id
      join units un on un.id = mr.unit_id
      order by mr.created_at desc
      limit $1 offset $2
      `,
      [limit, offset]
    );

    const totalRes = await pool.query("select count(*)::int as n from match_requests");
    return { total: totalRes.rows[0].n, limit, offset, requests: r.rows };
  },

  async listBlocks({ limit, offset }) {
    const r = await pool.query(
      `
      select
        b.*,
        ub.name as blocker_name, ub.email as blocker_email,
        ux.name as blocked_name, ux.email as blocked_email
      from blocks b
      join users ub on ub.id = b.blocker_user_id
      join users ux on ux.id = b.blocked_user_id
      order by b.created_at desc
      limit $1 offset $2
      `,
      [limit, offset]
    );

    const totalRes = await pool.query("select count(*)::int as n from blocks");
    return { total: totalRes.rows[0].n, limit, offset, blocks: r.rows };
  }
};

module.exports = { adminRepo };
