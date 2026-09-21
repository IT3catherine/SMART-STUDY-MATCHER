require("dotenv").config();

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@db:', '@localhost:').replace('5432', '5434');
}

const fs = require("fs");
const path = require("path");
const { pool } = require("./src/config/db");

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, "src/db/migrations/007_chat_and_context.sql"), "utf8");
    await pool.query(sql);
    console.log("Migration 007 ran successfully!");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}
run();
