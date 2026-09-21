const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { blockRepo } = require("../repositories/block.repo");
const { eventRepo } = require("../repositories/event.repo");


const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const blockedUsers = await blockRepo.listBlockedUsers(req.user.sub);
    res.json({ blocks: blockedUsers });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ blocked_user_id: z.string().uuid() }).parse(req.body);
    if (body.blocked_user_id === req.user.sub) {
      return res.status(400).json({ error: "You cannot block yourself" });
    }
    await blockRepo.block({ blocker_user_id: req.user.sub, blocked_user_id: body.blocked_user_id });
    await eventRepo.log({ type: 'BLOCK_CREATE', actor_user_id: req.user.sub, entity_type: 'block', entity_id: body.blocked_user_id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/:blockedUserId", requireAuth, async (req, res, next) => {
  try {
    await blockRepo.unblock({ blocker_user_id: req.user.sub, blocked_user_id: req.params.blockedUserId });
    await eventRepo.log({ type: 'BLOCK_DELETE', actor_user_id: req.user.sub, entity_type: 'block', entity_id: req.params.blockedUserId });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
