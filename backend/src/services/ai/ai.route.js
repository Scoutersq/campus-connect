const { Router } = require("express");
const { userOrAdminMiddleware } = require("../../middlewares/userOrAdmin.middleware.js");
const { handleAiCommand } = require("./ai.controller.js");

const aiRouter = Router();

aiRouter.post("/command", userOrAdminMiddleware, handleAiCommand);

module.exports = {
  aiRouter,
};
