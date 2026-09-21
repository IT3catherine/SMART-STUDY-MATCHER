const { unitRepo } = require("../repositories/unit.repo");
const { availabilityRepo } = require("../repositories/availability.repo");
const { profileRepo } = require("../repositories/profile.repo");
const { feedbackRepo } = require("../repositories/feedback.repo");
const { requestRepo } = require("../repositories/request.repo");
const { blockRepo } = require("../repositories/block.repo");
const { availabilityService } = require("./availability.service");
const { timeOverlapService } = require("./timeOverlap.service");

function jaccard(a = [], b = []) {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union;
}

function learningStyleScore(my, their) {
  if (!my || !their) return 0.6;
  if (my === their) return 1.0;
  return 0.7;
}

const matchingService = {
  async rankMatchesForUnit(userId, unitId) {
    const rawCandidates = await unitRepo.findCandidatesForUnit(userId, unitId);

    const mySlots = await availabilityRepo.listForUser(userId);
    const myProfile = await profileRepo.getByUserId(userId);

    const results = [];

    for (const c of rawCandidates) {
      const blocked = await blockRepo.isBlockedEitherWay(userId, c.user_id);
      if (blocked) continue;

      const declinedRecently = await requestRepo.wasDeclinedRecently({
        from_user_id: userId,
        to_user_id: c.user_id,
        unit_id: unitId,
        withinDays: 14
      });
      if (declinedRecently) continue;

      const theirSlots = await availabilityRepo.listForUser(c.user_id);
      const theirProfile = await profileRepo.getByUserId(c.user_id);
      const rep = await feedbackRepo.getReputationScore(c.user_id);

      const C = c.course_overlap; // 1.0 for per-unit MVP
      const A = availabilityService.computeOverlapScore(mySlots, theirSlots);
      const G = jaccard(myProfile?.goals || [], theirProfile?.goals || []);
      const L = learningStyleScore(myProfile?.learning_style, theirProfile?.learning_style);
      const F = rep;

      const score = 0.35 * C + 0.3 * A + 0.2 * G + 0.1 * L + 0.05 * F;

      const suggested_times = timeOverlapService.suggest(mySlots, theirSlots, {
        minMinutes: 30,
        maxSuggestions: 5
      });

      results.push({
        user_id: c.user_id,
        name: c.name,
        program: theirProfile?.program || null,
        year: theirProfile?.year || null,
        shared_unit_id: unitId,
        score,
        breakdown: { C, A, G, L, F },
        suggested_times
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }
};

module.exports = { matchingService };
