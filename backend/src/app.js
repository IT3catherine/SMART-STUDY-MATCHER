const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const unitRoutes = require("./routes/units.routes");
const enrollmentRoutes = require("./routes/enrollments.routes");
const availabilityRoutes = require("./routes/availability.routes");
const matchingRoutes = require("./routes/matching.routes");
const requestRoutes = require("./routes/requests.routes");
const matchRoutes = require("./routes/matches.routes");
const sessionRoutes = require("./routes/sessions.routes");
const blockRoutes = require("./routes/blocks.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const notificationRoutes = require("./routes/notifications.routes");
const adminRoutes = require("./routes/admin.routes");
const messageRoutes = require("./routes/messages.routes");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));

  const origins = (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
    
  origins.push("http://localhost:5173", "http://localhost:5174");

  app.use(
    cors({
      origin: origins.includes("*") ? "*" : origins,
      credentials: true
    })
  );

  app.get("/", (req, res) => res.json({ name: "Study Matcher API" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/units", unitRoutes);
  app.use("/api/enrollments", enrollmentRoutes);
  app.use("/api/availability", availabilityRoutes);
  app.use("/api/matching", matchingRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/matches", matchRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/blocks", blockRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/messages", messageRoutes);

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
