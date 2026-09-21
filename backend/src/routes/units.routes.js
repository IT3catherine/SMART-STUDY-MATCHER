const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { unitRepo } = require("../repositories/unit.repo");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const units = await unitRepo.list();
    res.json({ units });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const unit = await unitRepo.create(req.body);
    res.json({ unit });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
