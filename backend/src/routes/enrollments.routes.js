const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { enrollmentRepo } = require("../repositories/enrollment.repo");
const { eventRepo } = require("../repositories/event.repo");


const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const items = await enrollmentRepo.listMyEnrollments(req.user.sub);
    res.json({ enrollments: items });
  } catch (e) {
    next(e);
  }
});

router.post("/me", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        unit_id: z.string().uuid(),
        semester: z.string().optional().nullable()
      })
      .parse(req.body);

    const row = await enrollmentRepo.add({
      user_id: req.user.sub,
      unit_id: body.unit_id,
      semester: body.semester || null
    });

    await eventRepo.log({ type: 'ENROLLMENT_ADD', actor_user_id: req.user.sub, entity_type: 'unit', entity_id: body.unit_id, metadata: { semester: body.semester || null } });
    res.json({ enrollment: row });
  } catch (e) {
    next(e);
  }
});

router.delete("/me/:unitId", requireAuth, async (req, res, next) => {
  try {
    const unitId = req.params.unitId;
    await enrollmentRepo.remove({ user_id: req.user.sub, unit_id: unitId });
    await eventRepo.log({ type: 'ENROLLMENT_REMOVE', actor_user_id: req.user.sub, entity_type: 'unit', entity_id: unitId });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
