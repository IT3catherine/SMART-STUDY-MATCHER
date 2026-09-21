const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { availabilityRepo } = require("../repositories/availability.repo");
const { eventRepo } = require("../repositories/event.repo");


const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const slots = await availabilityRepo.listForUser(req.user.sub);
    res.json({ slots });
  } catch (e) {
    next(e);
  }
});

const slotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d\d:\d\d(:\d\d)?$/),
  end_time: z.string().regex(/^\d\d:\d\d(:\d\d)?$/)
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const slots = z.array(slotSchema).parse(req.body.slots || []);
    await availabilityRepo.replaceForUser(req.user.sub, slots);
    await eventRepo.log({ type: 'AVAILABILITY_REPLACE', actor_user_id: req.user.sub, entity_type: 'availability', entity_id: req.user.sub, metadata: { slots: slots.length } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
