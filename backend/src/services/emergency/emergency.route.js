const { Router } = require("express");
const { z } = require("zod");
const { emergencyAlertModel } = require("../../models/emergencyAlert.model.js");
const { notificationModel } = require("../../models/notifications.model.js");
const { adminMiddleware } = require("../../middlewares/admin.middleware.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateBody, validateQuery, validateParams } = require("../../utils/validation.js");

const emergencyRouter = Router();

const emergencyCreateSchema = z.object({
  title: z.string().trim().min(5).max(140),
  message: z.string().trim().min(20).max(2000),
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  category: z
    .enum(["weather", "security", "health", "infrastructure", "other"])
    .default("other"),
  audience: z.enum(["all", "students", "faculty"]).default("all"),
  deliveryChannels: z
    .array(z.enum(["in-app", "push", "email", "sms"]))
    .min(1)
    .max(4)
    .default(["in-app"]),
  expiresAt: z
    .coerce.date()
    .optional()
    .refine((date) => !date || date > new Date(), "Expiry must be in the future."),
  metadata: z
    .object({
      location: z.string().trim().min(3).max(120).optional(),
      attachments: z
        .array(z.string().trim().url().max(2048))
        .max(5)
        .optional(),
    })
    .optional(),
});

const emergencyQuerySchema = z.object({
  status: z.enum(["active", "expired", "all"]).default("active"),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  audience: z.enum(["all", "students", "faculty"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const alertIdParamsSchema = z.object({
  alertId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid alert id."),
});

const markExpiredAlerts = async () => {
  const now = new Date();
  await emergencyAlertModel.updateMany(
    { isActive: true, expiresAt: { $lte: now } },
    { $set: { isActive: false } }
  );
};

emergencyRouter.post(
  "/",
  adminMiddleware,
  validateBody(emergencyCreateSchema),
  async (req, res) => {
    try {
      const alert = await emergencyAlertModel.create({
        title: req.body.title,
        message: req.body.message,
        severity: req.body.severity,
        category: req.body.category,
        audience: req.body.audience,
        deliveryChannels: req.body.deliveryChannels,
        expiresAt: req.body.expiresAt,
        metadata: req.body.metadata,
        createdBy: req.adminID,
      });

      await notificationModel.create({
        title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        message: alert.message,
        category: "emergency",
        targetAudience: alert.audience,
        expiresAt: alert.expiresAt,
        isImportant: true,
        createdBy: req.adminID,
      });

      return res.status(201).json({
        success: true,
        message: "Emergency alert created successfully.",
        alert,
      });
    } catch (error) {
      console.error("Error creating emergency alert:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

emergencyRouter.get(
  "/",
  adminMiddleware,
  validateQuery(emergencyQuerySchema),
  async (req, res) => {
    try {
      await markExpiredAlerts();

      const { status, severity, audience, page, limit } = req.query;
      const now = new Date();
      const filters = {};

      if (severity) {
        filters.severity = severity;
      }

      if (audience) {
        filters.audience = audience;
      }

      if (status === "active") {
        filters.isActive = true;
        filters.$or = [{ expiresAt: null }, { expiresAt: { $gt: now } }];
      } else if (status === "expired") {
        filters.$or = [
          { isActive: false },
          { expiresAt: { $lte: now } },
        ];
      }

      const skip = (page - 1) * limit;

      const [alerts, total] = await Promise.all([
        emergencyAlertModel
          .find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        emergencyAlertModel.countDocuments(filters),
      ]);

      return res.status(200).json({
        success: true,
        data: alerts,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: skip + alerts.length < total,
        },
      });
    } catch (error) {
      console.error("Error fetching emergency alerts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

emergencyRouter.get(
  "/active",
  userMiddleware,
  async (req, res) => {
    try {
      await markExpiredAlerts();

      const now = new Date();
      const alerts = await emergencyAlertModel
        .find({
          isActive: true,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        })
        .sort({ severity: -1, createdAt: -1 })
        .lean();

      const response = alerts.map((alert) => ({
        ...alert,
        acknowledged: alert.acknowledgedBy?.some(
          (id) => id.toString() === req.userID
        ),
      }));

      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error("Error fetching active alerts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

emergencyRouter.post(
  "/:alertId/acknowledge",
  userMiddleware,
  validateParams(alertIdParamsSchema),
  async (req, res) => {
    try {
      const alert = await emergencyAlertModel.findOne({
        _id: req.params.alertId,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });

      if (!alert || !alert.isActive) {
        return res.status(404).json({
          success: false,
          message: "Alert not found or already expired.",
        });
      }

      await emergencyAlertModel.updateOne(
        { _id: alert._id },
        { $addToSet: { acknowledgedBy: req.userID } }
      );

      return res.status(200).json({
        success: true,
        message: "Alert acknowledged.",
      });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

module.exports = {
  emergencyRouter,
};
