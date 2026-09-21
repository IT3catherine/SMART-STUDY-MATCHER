const cron = require("node-cron");
const { sessionRepo } = require("../repositories/session.repo");
const { emailService } = require("../services/email.service");

/*
  Simple cron-based reminders inside the API container.

  - Every minute we check for sessions starting soon
  - If a reminder hasn’t been sent yet, we send it and mark it sent
*/
function startReminderCron() {
  const enabled = String(process.env.REMINDERS_ENABLED || "true") === "true";
  if (!enabled) {
    console.log("Reminder cron disabled (REMINDERS_ENABLED=false)");
    return;
  }

  const windowMinutes = Number(process.env.REMINDER_WINDOW_MINUTES || 60);

  cron.schedule("* * * * *", async () => {
    try {
      const due = await sessionRepo.listSessionsNeedingReminder(windowMinutes);

      for (const s of due) {
        await emailService.sendSessionReminderEmail({
          toUserId: s.user1_id,
          otherName: s.user2_name,
          startsAt: s.starts_at
        });

        await emailService.sendSessionReminderEmail({
          toUserId: s.user2_id,
          otherName: s.user1_name,
          startsAt: s.starts_at
        });

        await sessionRepo.markReminderSent(s.id);
      }
    } catch (e) {
      console.error("Reminder cron error:", e);
    }
  });

  console.log("Reminder cron started");
}

module.exports = { startReminderCron };
