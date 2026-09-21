const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { matchRepo } = require("../repositories/match.repo");

const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const matches = await matchRepo.listForUser(req.user.sub);
    res.json({ matches });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/contact", requireAuth, async (req, res, next) => {
  try {
    const contact = await matchRepo.getOtherUserContact({
      match_id: req.params.id,
      acting_user_id: req.user.sub
    });
    res.json({ contact });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
