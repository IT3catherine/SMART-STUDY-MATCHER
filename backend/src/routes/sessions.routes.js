const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { sessionRepo } = require("../repositories/session.repo");
const { matchRepo } = require("../repositories/match.repo");
const { eventRepo } = require("../repositories/event.repo");


const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const sessions = await sessionRepo.listForUser(req.user.sub);
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  match_id: z.string().uuid(),
  starts_at: z.string().datetime(), // ISO string
  ends_at: z.string().datetime(),
  mode: z.enum(["online", "physical", "hybrid"]).default("online"),
  location_text: z.string().max(200).optional().nullable(),
  meeting_link: z.string().url().optional().nullable()
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);

    const match = await matchRepo.findById(body.match_id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    const isMember = match.user1_id === req.user.sub || match.user2_id === req.user.sub;
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

    if (new Date(body.ends_at).getTime() <= new Date(body.starts_at).getTime()) {
      return res.status(400).json({ error: "ends_at must be after starts_at" });
    }

    const session = await sessionRepo.create({
      match_id: body.match_id,
      created_by_user_id: req.user.sub,
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      mode: body.mode,
      location_text: body.location_text,
      meeting_link: body.meeting_link
    });

    await eventRepo.log({ type: 'SESSION_CREATE', actor_user_id: req.user.sub, entity_type: 'session', entity_id: session.id, metadata: { match_id: body.match_id } });
    res.json({ session });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await sessionRepo.deleteIfOwner({ session_id: req.params.id, acting_user_id: req.user.sub });
    await eventRepo.log({ type: 'SESSION_DELETE', actor_user_id: req.user.sub, entity_type: 'session', entity_id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
