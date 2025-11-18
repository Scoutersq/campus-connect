const { Router } = require("express");
const { z } = require("zod");
const { asyncHandler } = require("../../utils/asyncHandler.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const {
  validateQuery,
  validateBody,
  validateParams,
} = require("../../utils/validation.js");
const mentorshipController = require("../../controllers/skills/mentorship.controller.js");

const router = Router();

const requestsQuerySchema = z.object({
  role: z.enum(["mentor", "learner"]).default("learner"),
  status: z.enum(["pending", "accepted", "declined", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const requestIdParamsSchema = z.object({
  requestId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/i, "Invalid request id."),
});

const requestUpdateSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

router.get(
  "/requests",
  userMiddleware,
  validateQuery(requestsQuerySchema),
  asyncHandler(mentorshipController.getRequests)
);

router.put(
  "/requests/:requestId",
  userMiddleware,
  validateParams(requestIdParamsSchema),
  validateBody(requestUpdateSchema),
  asyncHandler(mentorshipController.updateRequest)
);

module.exports = router;
