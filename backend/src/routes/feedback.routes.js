const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { feedbackRepo } = require("../repositories/feedback.repo");
const { eventRepo } = require("../repositories/event.repo");


const router = express.Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        to_user_id: z.string().uuid(),
        match_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).optional().nullable()
      })
      .parse(req.body);

    const row = await feedbackRepo.create({
      from_user_id: req.user.sub,
      to_user_id: body.to_user_id,
      match_id: body.match_id,
      rating: body.rating,
      comment: body.comment
    });

    await eventRepo.log({ type: 'FEEDBACK_CREATE', actor_user_id: req.user.sub, entity_type: 'feedback', entity_id: row.id, metadata: { to_user_id: body.to_user_id, match_id: body.match_id, rating: body.rating } });
    res.json({ feedback: row });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
