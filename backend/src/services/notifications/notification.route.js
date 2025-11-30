const { Router } = require("express");
const { z } = require("zod");
const { notificationModel } = require("../../models/notifications.model.js");
const { adminMiddleware } = require("../../middlewares/admin.middleware.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateBody, validateParams } = require("../../utils/validation.js");
const { extractTokenFromRequest } = require("../../utils/session.js");
const jwt = require("jsonwebtoken");
const notificationRouter = Router();

const urgencyEnum = ["low", "medium", "high"];
const statusEnum = ["new", "update", "reminder"];

const createNotificationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(5).max(1000),
  category: z.enum(["notices", "events", "update", "holidays", "others", "emergency"]).optional().default("notices"),
  targetAudience: z.enum(["students", "faculty", "all"]).optional().default("all"),
  expiresAt: z.coerce.date().optional(),
  isImportant: z.boolean().optional().default(false),
  status: z.enum(statusEnum).optional().default("new"),
  urgency: z.enum(urgencyEnum).optional(),
  topic: z.string().trim().min(2).max(50).optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(6)
    .optional()
    .default([]),
});

const buildNotificationResponse = (doc, currentUserId = null) => {
  const notification = doc.toObject ? doc.toObject() : doc;
  const readBy = Array.isArray(notification.readBy) ? notification.readBy : [];
  const isRead = currentUserId ? readBy.some((id) => String(id) === String(currentUserId)) : false;

  return {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    category: notification.category,
    targetAudience: notification.targetAudience,
    status: notification.status || "new",
    urgency: notification.urgency || (notification.isImportant ? "high" : "medium"),
    topic: notification.topic || notification.category || "General",
    tags: Array.isArray(notification.tags) ? notification.tags : [],
    isImportant: Boolean(notification.isImportant),
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt || null,
    readBy,
    isRead,
  };
};

const notificationIdParamsSchema = z.object({
  notificationId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid notification id."),
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
        status: req.body.status || "new",
        urgency: req.body.urgency || (req.body.isImportant ? "high" : "medium"),
        topic: req.body.topic || "General",
        tags: req.body.tags?.length ? Array.from(new Set(req.body.tags)) : [],
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
    let currentUserId = null;
    const token = extractTokenFromRequest(req, "user");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
        if (decoded?.role === "user") {
          currentUserId = decoded.id;
        }
      } catch (error) {
        // ignore invalid or expired tokens for public reads
      }
    }

    const notifications = await notificationModel.find({}).sort({ createdAt: -1 });

    if (!notifications.length) {
      return res.status(404).json({
        success: false,
        message: "No notifications found.",
      });
    }

    const formatted = notifications.map((notification) =>
      buildNotificationResponse(notification, currentUserId)
    );

    const unreadCount = currentUserId
      ? formatted.filter((item) => !item.isRead).length
      : 0;

    res.status(200).json({
      success: true,
      count: formatted.length,
      unreadCount,
      notifications: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

notificationRouter.post(
  "/:notificationId/read",
  userMiddleware,
  validateParams(notificationIdParamsSchema),
  async (req, res) => {
    try {
      const notification = await notificationModel.findById(req.params.notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
      }

      await notificationModel.updateOne(
        { _id: notification._id },
        { $addToSet: { readBy: req.userID } }
      );

      return res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        notification: {
          _id: notification._id,
          isRead: true,
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

module.exports = {
  notificationRouter,
};
