const express = require("express");
const { z } = require("zod");
const { requireAuth, requireRole } = require("../middleware/auth");
const { adminRepo } = require("../repositories/admin.repo");

const router = express.Router();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

/**
 * GET /api/admin/analytics/summary
 * Returns high-level counts for dashboard widgets.
 */
router.get("/analytics/summary", async (req, res, next) => {
  try {
    const summary = await adminRepo.analyticsSummary();
    res.json({ summary });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/users?limit=&offset=&q=
 * Lists users with pagination and optional search (name/email).
 */
router.get("/users", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const q = (req.query.q || "").toString().trim();

    const out = await adminRepo.listUsers({ limit, offset, q });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/admin/users/:id/active
 * Body: { is_active: boolean }
 * Updates a user's student_profiles.is_active flag.
 */
router.post("/users/:id/active", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const body = z.object({ is_active: z.boolean() }).parse(req.body);

    const profile = await adminRepo.setUserActive({ userId, is_active: body.is_active });
    res.json({ profile });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/events?limit=
 * Lists recent audit events (simple admin log).
 */
router.get("/events", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 500);
    const events = await adminRepo.listEvents({ limit });
    res.json({ events });
  } catch (e) {
    next(e);
  }
});

/**
 * Moderation lists
 * - feedback
 * - requests
 * - blocks
 */
router.get("/moderation/feedback", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const out = await adminRepo.listFeedback({ limit, offset });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.get("/moderation/requests", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const out = await adminRepo.listRequests({ limit, offset });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.get("/moderation/blocks", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const out = await adminRepo.listBlocks({ limit, offset });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
