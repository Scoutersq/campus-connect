const express = require('express');
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { userRouter } = require("./services/auth/user.route.js");
const { adminRouter } = require("./services/auth/admin.route.js");
const { authRouter } = require("./services/auth/auth.route.js");
const { profileRouter } = require("./services/profile/profile.route.js");
const { usersRouter } = require("./services/users/users.route.js");
const { lostRouter } = require("./services/lost/lost-items.route.js");
const { foundRouter } = require("./services/found/found-items.route.js");
const { notificationRouter } = require("./services/notifications/notification.route.js");
const { eventRouter } = require("./services/events/events.route.js");
const { noteSharingRouter } = require("./services/notes/notesSharing.route.js");
const skillsExchangeRouter = require("./routes/skills/skillsExchange.routes.js");
const mentorshipRouter = require("./routes/skills/mentorship.routes.js");
const skillsDirectoryRouter = require("./routes/skills/skillsDirectory.routes.js");
const { emergencyRouter } = require("./services/emergency/emergency.route.js");
const cors = require('cors');
const {
	postsRouter,
	commentsRouter,
} = require("./services/discussion/discussion.route.js");
const app = express();
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser");
dotenv.config();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(helmet());

const normalizeOrigin = (value = "") => value.replace(/\/?$/, "").trim();

const defaultOrigins = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:4173",
].map(normalizeOrigin);

const envOrigins = (process.env.CLIENT_ORIGIN || "")
	.split(",")
	.map(normalizeOrigin)
	.filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
	cors({
		origin(origin, callback) {
			const normalizedOrigin = normalizeOrigin(origin);
			if (!origin) {
				return callback(null, true);
			}
			if (allowedOrigins.includes(normalizedOrigin)) {
				return callback(null, true);
			}
			return callback(new Error(`Origin ${normalizedOrigin || origin} not allowed by CORS`));
		},
		credentials: true,
	})
);

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

const authLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 15,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many authentication attempts. Please wait a minute before trying again.",
	},
});

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 500,
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => req.path.startsWith("/auth"),
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

app.use("/api/auth/admin", adminRouter);
app.use("/api/auth/user", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/lost",lostRouter);
app.use("/api/found",foundRouter);
app.use("/api/notification",notificationRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/announcements", notificationRouter);
app.use("/api/events", eventRouter);
app.use("/api/notes", noteSharingRouter);
app.use("/api/skills-exchange", skillsExchangeRouter);
app.use("/api/mentorship", mentorshipRouter);
app.use("/api", skillsDirectoryRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);

app.use((err, req, res, next) => {
	const statusCode = err.statusCode || err.status || 500;
	const message = err.message || "Internal server error.";

	if (statusCode >= 500) {
		console.error(err);
	}

	res.status(statusCode).json({
		success: false,
		message,
	});
});

module.exports = app;