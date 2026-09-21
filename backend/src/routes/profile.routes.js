const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { profileRepo } = require("../repositories/profile.repo");
const { eventRepo } = require("../repositories/event.repo");


const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await profileRepo.getByUserId(req.user.sub);
    res.json({ profile });
  } catch (e) {
    next(e);
  }
});

const upsertSchema = z.object({
  program: z.string().min(1),
  year: z.string().min(1),
  learning_style: z.string().optional().nullable(),
  goals: z.array(z.string()).default([]),
  bio: z.string().max(500).optional().nullable(),
  collaboration_mode: z.enum(["online", "physical", "hybrid"]).default("online"),
  location: z.string().optional().nullable(),
  contact_pref: z.enum(["email"]).default("email"),
  is_active: z.boolean().default(true)
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const profile = await profileRepo.upsert(req.user.sub, data);
    await eventRepo.log({ type: 'PROFILE_UPSERT', actor_user_id: req.user.sub, entity_type: 'profile', entity_id: req.user.sub });
    res.json({ profile });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
