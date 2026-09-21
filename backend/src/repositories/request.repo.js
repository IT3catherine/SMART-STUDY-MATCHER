const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

const requestRepo = {
  async create({ from_user_id, to_user_id, unit_id }) {
    const checkReq = await pool.query(
      `select 1 from match_requests 
       where ((from_user_id=$1 and to_user_id=$2) or (from_user_id=$2 and to_user_id=$1))
         and unit_id=$3 
         and status IN ('PENDING', 'ACCEPTED')`,
      [from_user_id, to_user_id, unit_id]
    );
    if (checkReq.rowCount > 0) throw Object.assign(new Error("You already have an active request with this user for this class!"), { status: 400 });

    const checkMatch = await pool.query(
      `select 1 from matches 
       where ((user1_id=$1 and user2_id=$2) or (user1_id=$2 and user2_id=$1))
         and unit_id=$3 
         and active=true`,
      [from_user_id, to_user_id, unit_id]
    );
    if (checkMatch.rowCount > 0) throw Object.assign(new Error("You are already matched with this user for this class!"), { status: 400 });

    const id = randomUUID();
    const r = await pool.query(
      `insert into match_requests (id, from_user_id, to_user_id, unit_id, status)
       values ($1,$2,$3,$4,'PENDING')
       returning *`,
      [id, from_user_id, to_user_id, unit_id]
    );
    return r.rows[0];
  },

  async listInbox(userId) {
    const r = await pool.query(
      `select mr.*, u.name as from_name
       from match_requests mr
       join users u on u.id = mr.from_user_id
       where mr.to_user_id=$1
       order by mr.created_at desc`,
      [userId]
    );
    return r.rows;
  },

  async listSent(userId) {
    const r = await pool.query(
      `select mr.*, u.name as to_name
       from match_requests mr
       join users u on u.id = mr.to_user_id
       where mr.from_user_id=$1
       order by mr.created_at desc`,
      [userId]
    );
    return r.rows;
  },

  async accept(actingUserId, requestId) {
    const client = await pool.connect();
    try {
      await client.query("begin");

      const reqRes = await client.query("select * from match_requests where id=$1 for update", [requestId]);
      const reqRow = reqRes.rows[0];
      if (!reqRow) throw Object.assign(new Error("Request not found"), { status: 404 });
      if (reqRow.to_user_id !== actingUserId) throw Object.assign(new Error("Forbidden"), { status: 403 });
      if (reqRow.status !== "PENDING") throw Object.assign(new Error("Request already handled"), { status: 400 });

      await client.query("update match_requests set status='ACCEPTED' where id=$1", [requestId]);

      const matchId = randomUUID();
      const matchRes = await client.query(
        "insert into matches (id, user1_id, user2_id, unit_id, active) values ($1,$2,$3,$4,true) returning *",
        [matchId, reqRow.from_user_id, reqRow.to_user_id, reqRow.unit_id]
      );

      await client.query("commit");
      return { ...reqRow, match: matchRes.rows[0] };
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  },

  async decline(actingUserId, requestId) {
    const r = await pool.query("select * from match_requests where id=$1", [requestId]);
    const row = r.rows[0];
    if (!row) throw Object.assign(new Error("Request not found"), { status: 404 });
    if (row.to_user_id !== actingUserId) throw Object.assign(new Error("Forbidden"), { status: 403 });
    await pool.query("update match_requests set status='DECLINED' where id=$1", [requestId]);
  },

  async delete(actingUserId, requestId) {
    const r = await pool.query("select * from match_requests where id=$1", [requestId]);
    const row = r.rows[0];
    if (!row) throw Object.assign(new Error("Request not found"), { status: 404 });
    if (row.to_user_id !== actingUserId && row.from_user_id !== actingUserId) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    await pool.query("delete from match_requests where id=$1", [requestId]);
  },

  async wasDeclinedRecently({ from_user_id, to_user_id, unit_id, withinDays = 14 }) {
    const r = await pool.query(
      `
      select 1 as yes
      from match_requests
      where from_user_id=$1 and to_user_id=$2 and unit_id=$3
        and status='DECLINED'
        and created_at >= now() - ($4 || ' days')::interval
      limit 1
      `,
      [from_user_id, to_user_id, unit_id, String(withinDays)]
    );
    return (r.rows[0]?.yes || 0) === 1;
  }
};

module.exports = { requestRepo };
