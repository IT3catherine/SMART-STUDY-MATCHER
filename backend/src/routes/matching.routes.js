const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { matchingService } = require("../services/matching.service");

const router = express.Router();

router.get("/for-unit/:unitId", requireAuth, async (req, res, next) => {
  try {
    const unitId = req.params.unitId;
    const results = await matchingService.rankMatchesForUnit(req.user.sub, unitId);
    res.json({ results });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
