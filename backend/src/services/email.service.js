const { getTransporter } = require("../config/mailer");
const { userRepo } = require("../repositories/user.repo");

async function sendMail({ to, subject, text }) {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_EMAIL}>`,
      to,
      subject,
      text
    });
  } catch (err) {
    console.error("Failed to send email (check SMTP credentials):", err.message);
  }
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString();
}

const emailService = {
  async sendRequestReceivedEmail({ toUserId, fromName, unitId }) {
    const u = await userRepo.findById(toUserId);
    if (!u) return;
    const subject = "New study match request";
    const text = `You received a study partner request from ${fromName} (unit ${unitId}). Open the app to respond.`;
    await sendMail({ to: u.email, subject, text });
  },

  async sendRequestAcceptedEmail({ toUserId, byName, unitId }) {
    const u = await userRepo.findById(toUserId);
    if (!u) return;
    const subject = "Your study match request was accepted";
    const text = `${byName} accepted your request for unit ${unitId}. Open the app to see details and schedule a session.`;
    await sendMail({ to: u.email, subject, text });
  },

  async sendSessionReminderEmail({ toUserId, otherName, startsAt }) {
    const u = await userRepo.findById(toUserId);
    if (!u) return;
    const subject = "Study session reminder";
    const text = `Reminder: your study session with ${otherName} starts at ${fmtDate(startsAt)}.`;
    await sendMail({ to: u.email, subject, text });
  },

  async sendMfaCodeEmail({ toUserId, code }) {
    const u = await userRepo.findById(toUserId);
    if (!u) return;
    const subject = "Your Study Matcher Security Code";
    const text = `Unrecognized device detected. Your 6-digit security code is: ${code}`;
    await sendMail({ to: u.email, subject, text });
  }
};

module.exports = { emailService };
