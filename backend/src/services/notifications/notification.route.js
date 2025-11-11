const { Router } = require("express");
const { z } = require("zod");
const { notificationModel } = require("../../models/notifications.model.js");
const { adminMiddleware } = require("../../middlewares/admin.middleware.js");
const { validateBody } = require("../../utils/validation.js");
const notificationRouter = Router();

const createNotificationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(5).max(500),
  category: z.enum(["notices", "events", "update", "holidays", "others"]),
  targetAudience: z.enum(["students", "faculty", "all"]).optional().default("all"),
  expiresAt: z.coerce.date().optional(),
  isImportant: z.boolean().optional().default(false),
});

notificationRouter.post(
  "/create",
  adminMiddleware,
  validateBody(createNotificationSchema),
  async (req, res) => {
    try {
      const notification = await notificationModel.create({
        title: req.body.title,
        message: req.body.message,
        category: req.body.category,
        targetAudience: req.body.targetAudience,
        expiresAt: req.body.expiresAt,
        isImportant: req.body.isImportant ?? false,
        createdBy: req.adminID,
      });

      return res.status(201).json({
        success: true,
        message: "Notification created successfully.",
        notification,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  }
);

notificationRouter.get("/", async (req, res) => {
  try {
    const notifications = await notificationModel
      .find({})
      .sort({ createdAt: -1 })
      .lean();

    if (!notifications.length) {
      return res.status(404).json({
        success: false,
        message: "No notifications found.",
      });
    }

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = {
  notificationRouter,
};
