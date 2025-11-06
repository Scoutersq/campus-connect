const express = require('express');
const { userRouter } = require("../src/routes/auth/user.route.js")
const { lostRouter } = require("./routes/lost-items.route.js")
const { foundRouter } = require("./routes/found-items.route.js")
const { adminRouter } = require("../src/routes/auth/admin.route.js")
const { notificationRouter } = require("./routes/notification.route.js");
const { eventRouter } = require("../src/routes/events.routes.js");
const { noteSharingRouter } = require("../src/routes/notesSharing.route.js");
const app = express();
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser");
dotenv.config();

app.use(cookieParser());
app.use(express.json());

app.use("/admin",adminRouter);
app.use("/user",userRouter);
app.use("/lost",lostRouter);
app.use("/found",foundRouter);
app.use("/notification",notificationRouter);
app.use("/events",eventRouter);
app.use("/notes",noteSharingRouter)

module.exports = app;