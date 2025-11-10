const express = require('express');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { userRouter } = require("../src/routes/auth/user.route.js");
const { lostRouter } = require("./routes/lost-items.route.js");
const { foundRouter } = require("./routes/found-items.route.js");
const { adminRouter } = require("../src/routes/auth/admin.route.js");
const { notificationRouter } = require("./routes/notification.route.js");
const { eventRouter } = require("../src/routes/events.routes.js");
const { noteSharingRouter } = require("../src/routes/notesSharing.route.js");
const { discussionRouter } = require("../src/routes/discussion.route.js");
const { profileRouter } = require("../src/routes/profile/profile.route.js");
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

app.use("/admin",adminRouter);
app.use("/user",userRouter);
app.use("/lost",lostRouter);
app.use("/found",foundRouter);
app.use("/notification",notificationRouter);
app.use("/events",eventRouter);
app.use("/notes",noteSharingRouter);
app.use("/post",discussionRouter);
app.use("/profile", profileRouter);

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({
		success: false,
		message: "Internal server error.",
	});
});

module.exports = app;