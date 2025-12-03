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
const { adminDashboardRouter } = require("./services/admin/dashboard.route.js");
const { aiRouter } = require("./services/ai/ai.route.js");
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
app.use(
	helmet({
		contentSecurityPolicy: false,
		crossOriginResourcePolicy: false,
		crossOriginEmbedderPolicy: false,
		frameguard: false,
	})
);

const normalizeOrigin = (value = "") => value.replace(/\/?$/, "").trim();

const collectOrigins = (...sources) =>
	sources
		.filter((value) => typeof value === "string" && value.length > 0)
		.flatMap((value) => value.split(","))
		.map(normalizeOrigin)
		.filter(Boolean);

const collectOriginPatterns = (...sources) =>
	sources
		.filter((value) => typeof value === "string" && value.length > 0)
		.flatMap((value) => value.split(","))
		.map((pattern) => pattern.replace(/\/?$/, "").trim())
		.filter(Boolean);

const escapeRegexExceptStar = (value = "") => value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

const compileOriginPattern = (pattern) => {
	const source = pattern.replace(/\/?$/, "").trim();
	if (!source) {
		return null;
	}
	if (!source.includes("*")) {
		return {
			pattern: source,
			regex: new RegExp(`^${escapeRegexExceptStar(source)}$`, "i"),
		};
	}
	const escaped = escapeRegexExceptStar(source).replace(/\\\*/g, ".*");
	return {
		pattern: source,
		regex: new RegExp(`^${escaped}$`, "i"),
	};
};

const defaultOrigins = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:4173",
];

const envOrigins = collectOrigins(
	process.env.CLIENT_ORIGIN,
	process.env.CLIENT_ORIGINS,
	process.env.FRONTEND_URL,
	process.env.FRONTEND_URLS,
	process.env.ALLOWED_ORIGINS
);

const allowedOrigins = [...new Set([...defaultOrigins.map(normalizeOrigin), ...envOrigins])];

const originPatternSources = collectOriginPatterns(process.env.ALLOWED_ORIGIN_PATTERNS);
const allowedOriginPatterns = originPatternSources
	.map((pattern) => compileOriginPattern(pattern))
	.filter((compiled) => compiled && compiled.regex instanceof RegExp);

const allowedHeaders = [
	"Content-Type",
	"Authorization",
	"X-Requested-With",
	"Accept",
	"X-Portal-Role",
	"X-Auth-Role",
];

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
			if (allowedOriginPatterns.some(({ regex }) => regex.test(normalizedOrigin))) {
				return callback(null, true);
			}
			return callback(new Error(`Origin ${normalizedOrigin || origin} not allowed by CORS`));
		},
		credentials: true,
		allowedHeaders,
	})
);

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

const frameAncestorOrigins = allowedOrigins.filter((origin) => /^https?:\/\//i.test(origin));
const frameAncestorPatterns = originPatternSources.filter((pattern) => pattern.startsWith("https://*."));
const frameAncestors = ["'self'", ...frameAncestorOrigins, ...frameAncestorPatterns];
const uniqueFrameAncestors = [...new Set(frameAncestors)];

app.use((req, res, next) => {
	res.removeHeader("X-Frame-Options");
	if (!res.headersSent) {
		res.setHeader("Content-Security-Policy", `frame-ancestors ${uniqueFrameAncestors.join(" ")}`);
	}
	next();
});

app.get("/healthz", (req, res) => {
	res.status(200).json({ success: true });
});

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
app.use("/api/admin", adminDashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/lost",lostRouter);
app.use("/api/found",foundRouter);
app.use("/api/notification",notificationRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/announcements", notificationRouter);
app.use("/api/events", eventRouter);
app.use("/api/notes", noteSharingRouter);
app.use("/api/ai", aiRouter);
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