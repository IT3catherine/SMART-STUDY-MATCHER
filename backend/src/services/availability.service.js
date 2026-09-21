function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function overlapMinutes(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

const availabilityService = {
  computeOverlapScore(mySlots, theirSlots, desiredMinutes = 120) {
    let total = 0;
    for (const a of mySlots) {
      for (const b of theirSlots) {
        if (a.day_of_week !== b.day_of_week) continue;
        total += overlapMinutes(
          toMinutes(a.start_time),
          toMinutes(a.end_time),
          toMinutes(b.start_time),
          toMinutes(b.end_time)
        );
      }
    }
    return Math.min(1, total / desiredMinutes);
  }
};

module.exports = { availabilityService };
