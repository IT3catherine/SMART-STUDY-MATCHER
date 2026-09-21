const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

/**
 * Very simple audit/event log.
 * Use this to support admin dashboard and debugging.
 */
const eventRepo = {
  async log({ type, actor_user_id = null, entity_type = null, entity_id = null, metadata = {} }) {
    await pool.query(
      `insert into events (id, type, actor_user_id, entity_type, entity_id, metadata)
       values ($1,$2,$3,$4,$5,$6)`,
      [randomUUID(), type, actor_user_id, entity_type, entity_id, JSON.stringify(metadata || {})]
    );
  }
};

module.exports = { eventRepo };
