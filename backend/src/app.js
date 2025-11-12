const express = require('express');
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
const {
	postsRouter,
	commentsRouter,
} = require("./services/discussion/discussion.route.js");
const app = express();
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser");
dotenv.config();

app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(helmet());

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(apiLimiter);

app.use("/api/auth/admin", adminRouter);
app.use("/api/auth/user", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/lost",lostRouter);
app.use("/api/found",foundRouter);
app.use("/api/notification",notificationRouter);
app.use("/api/events", eventRouter);
app.use("/api/notes", noteSharingRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({
		success: false,
		message: "Internal server error.",
	});
});

module.exports = app;