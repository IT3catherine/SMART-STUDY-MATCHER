const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { messageRepo } = require("../repositories/message.repo");
const { matchRepo } = require("../repositories/match.repo");

const router = express.Router();

router.get("/:matchId", requireAuth, async (req, res, next) => {
  try {
    const match = await matchRepo.findById(req.params.matchId);
    if (!match) return res.status(404).json({ error: "Match not found" });
    if (match.user1_id !== req.user.sub && match.user2_id !== req.user.sub) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const messages = await messageRepo.listForMatch(req.params.matchId);
    res.json({ messages });
  } catch (e) {
    next(e);
  }
});

router.post("/:matchId/read", requireAuth, async (req, res, next) => {
  try {
    await messageRepo.markRead(req.params.matchId, req.user.sub);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
