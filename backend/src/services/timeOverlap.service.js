/*
  Produces concrete overlapping time suggestions from two users’ availability slots.

  Slot format:
  { day_of_week: 0..6, start_time: "HH:MM", end_time: "HH:MM" }

  Output:
  { day_of_week, start_time, end_time, minutes }
*/
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function overlapRange(a, b) {
  const start = Math.max(toMinutes(a.start_time), toMinutes(b.start_time));
  const end = Math.min(toMinutes(a.end_time), toMinutes(b.end_time));
  const minutes = Math.max(0, end - start);
  if (minutes <= 0) return null;
  return {
    day_of_week: a.day_of_week,
    start_time: toHHMM(start),
    end_time: toHHMM(end),
    minutes
  };
}

const timeOverlapService = {
  suggest(mySlots, theirSlots, { minMinutes = 30, maxSuggestions = 5 } = {}) {
    const suggestions = [];

    for (const a of mySlots) {
      for (const b of theirSlots) {
        if (a.day_of_week !== b.day_of_week) continue;
        const o = overlapRange(a, b);
        if (!o) continue;
        if (o.minutes < minMinutes) continue;
        suggestions.push(o);
      }
    }

    suggestions.sort((x, y) => y.minutes - x.minutes);

    const seen = new Set();
    const uniq = [];
    for (const s of suggestions) {
      const key = `${s.day_of_week}-${s.start_time}-${s.end_time}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(s);
      if (uniq.length >= maxSuggestions) break;
    }

    return uniq;
  }
};

module.exports = { timeOverlapService };
