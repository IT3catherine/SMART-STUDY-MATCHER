const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { requestRepo } = require("../repositories/request.repo");
const { notificationRepo } = require("../repositories/notification.repo");
const { emailService } = require("../services/email.service");
const { blockRepo } = require("../repositories/block.repo");
const { eventRepo } = require("../repositories/event.repo");
const { unitRepo } = require("../repositories/unit.repo");


const router = express.Router();

router.get("/inbox", requireAuth, async (req, res, next) => {
  try {
    const items = await requestRepo.listInbox(req.user.sub);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get("/sent", requireAuth, async (req, res, next) => {
  try {
    const items = await requestRepo.listSent(req.user.sub);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        to_user_id: z.string().uuid(),
        unit_id: z.string().uuid()
      })
      .parse(req.body);

    // Prevent requests to users who are blocked either direction
    const blocked = await blockRepo.isBlockedEitherWay(req.user.sub, body.to_user_id);
    if (blocked) return res.status(400).json({ error: "You cannot request this user" });

    // Optional anti-spam: if they declined recently, stop immediate repeats
    const declinedRecently = await requestRepo.wasDeclinedRecently({
      from_user_id: req.user.sub,
      to_user_id: body.to_user_id,
      unit_id: body.unit_id,
      withinDays: 14
    });
    if (declinedRecently) {
      return res.status(400).json({ error: "This user declined recently. Try again later." });
    }

    const reqRow = await requestRepo.create({
      from_user_id: req.user.sub,
      to_user_id: body.to_user_id,
      unit_id: body.unit_id
    });

    const unit = await unitRepo.findById(body.unit_id);
    await notificationRepo.create({
      user_id: body.to_user_id,
      type: "REQUEST_RECEIVED",
      payload: {
        from_user_id: req.user.sub,
        from_user_name: req.user.name,
        request_id: reqRow.id,
        unit_id: body.unit_id,
        unit_code: unit?.code || null,
        unit_name: unit?.name || null
       }

     });

    await emailService.sendRequestReceivedEmail({
      toUserId: body.to_user_id,
      fromName: req.user.name,
      unitId: body.unit_id
    });

    await eventRepo.log({ type: 'REQUEST_CREATE', actor_user_id: req.user.sub, entity_type: 'request', entity_id: reqRow.id, metadata: { to_user_id: body.to_user_id, unit_id: body.unit_id } });
    res.json({ request: reqRow });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/accept", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await requestRepo.accept(req.user.sub, id);

    await notificationRepo.create({
      user_id: result.from_user_id,
      type: "REQUEST_ACCEPTED",
      payload: { by_user_id: req.user.sub, by_user_name: req.user.name, request_id: id, unit_id: result.unit_id }
    });

    await emailService.sendRequestAcceptedEmail({
      toUserId: result.from_user_id,
      byName: req.user.name,
      unitId: result.unit_id
    });

    await eventRepo.log({ type: 'REQUEST_ACCEPT', actor_user_id: req.user.sub, entity_type: 'match', entity_id: result.match.id, metadata: { request_id: id } });
    res.json({ ok: true, match: result.match });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/decline", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    await requestRepo.decline(req.user.sub, id);
    await eventRepo.log({ type: 'REQUEST_DECLINE', actor_user_id: req.user.sub, entity_type: 'request', entity_id: id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    await requestRepo.delete(req.user.sub, id);
    await eventRepo.log({ type: 'REQUEST_DELETE', actor_user_id: req.user.sub, entity_type: 'request', entity_id: id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
