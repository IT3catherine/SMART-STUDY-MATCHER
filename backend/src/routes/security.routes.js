const express = require("express");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/sessions", requireAuth, async (req, res, next) => {
  try {
    const hist = await pool.query(
      "SELECT id, ip_address, user_agent, device_fingerprint, created_at FROM login_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",
      [req.user.sub]
    );
    res.json({ sessions: hist.rows });
  } catch (err) { next(err); }
});

router.post("/revoke", requireAuth, async (req, res, next) => {
  try {
    await pool.query("UPDATE users SET token_version = token_version + 1 WHERE id=$1", [req.user.sub]);
    await pool.query("DELETE FROM login_history WHERE user_id=$1", [req.user.sub]);
    res.json({ message: "Global Revocation Complete. All tokens detonated." });
  } catch (err) { next(err); }
});

module.exports = router;
