const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { notificationRepo } = require("../repositories/notification.repo");

const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const items = await notificationRepo.listForUser(req.user.sub);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
