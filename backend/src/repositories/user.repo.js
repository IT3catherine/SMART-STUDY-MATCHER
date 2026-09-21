const { pool } = require("../config/db");
const { randomUUID } = require("crypto");

const userRepo = {
  async createStudent({ name, email, password_hash }) {
    const id = randomUUID();
    const r = await pool.query(
      "insert into users (id, name, email, password_hash, role) values ($1,$2,$3,$4,'STUDENT') returning id,name,email,role",
      [id, name, email.toLowerCase(), password_hash]
    );
    return r.rows[0];
  },

  async findByEmail(email) {
    const r = await pool.query("select * from users where email=$1", [email.toLowerCase()]);
    return r.rows[0] || null;
  },

  async findById(id) {
    const r = await pool.query("select id,name,email,role from users where id=$1", [id]);
    return r.rows[0] || null;
  }
};

module.exports = { userRepo };
