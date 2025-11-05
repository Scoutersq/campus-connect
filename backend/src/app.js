const express = require('express');
const { userRouter } = require("../src/routes/user.route.js")
const { lostRouter } = require("../src/routes/lost-items.route.js")
const { foundRouter } = require("../src/routes/found-items.route.js")
const { adminRouter } = require("../src/routes/admin.route.js")
const { notificationRouter } = require("./routes/notification.route.js");
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


module.exports = app;