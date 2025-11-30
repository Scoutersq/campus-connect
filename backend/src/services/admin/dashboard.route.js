const { Router } = require("express");
const { adminMiddleware } = require("../../middlewares/admin.middleware.js");
const { userModel } = require("../../models/user.model.js");
const { adminModel } = require("../../models/admin.model.js");
const { lostModel } = require("../../models/lost.model.js");
const { foundModel } = require("../../models/found.model.js");
const { eventModel } = require("../../models/events.model.js");
const { notificationModel } = require("../../models/notifications.model.js");
const { noteSharingModel } = require("../../models/notesSharing.model.js");
const { emergencyAlertModel } = require("../../models/emergencyAlert.model.js");
const { postModelSchema } = require("../../models/discussion.model.js");
const { validateParams } = require("../../utils/validation.js");
const { z } = require("zod");

const adminDashboardRouter = Router();

const objectIdParamSchema = (paramName) =>
  z.object({
    [paramName]: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier supplied."),
  });

adminDashboardRouter.get("/overview", adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const activeSessionFilter = {
      activeSessionId: { $ne: null },
      $or: [{ sessionExpiresAt: null }, { sessionExpiresAt: { $gt: now } }],
    };

    const [
      totalUsers,
      activeUsers,
      totalAdmins,
      activeAdmins,
      totalLostItems,
      openLostItems,
      totalFoundItems,
      openFoundItems,
      totalEvents,
      upcomingEvents,
      totalAnnouncements,
      totalNotes,
      totalEmergencyAlerts,
      activeEmergencyAlerts,
      totalDiscussions,
      recentUsers,
      recentLost,
      recentFound,
      recentEvents,
      recentAnnouncements,
      recentAlerts,
    ] = await Promise.all([
      userModel.estimatedDocumentCount(),
      userModel.countDocuments(activeSessionFilter),
      adminModel.estimatedDocumentCount(),
      adminModel.countDocuments(activeSessionFilter),
      lostModel.estimatedDocumentCount(),
      lostModel.countDocuments({ status: "reported" }),
      foundModel.estimatedDocumentCount(),
      foundModel.countDocuments({ status: "reported" }),
      eventModel.estimatedDocumentCount(),
      eventModel.countDocuments({ date: { $gte: now } }),
      notificationModel.estimatedDocumentCount(),
      noteSharingModel.estimatedDocumentCount(),
      emergencyAlertModel.estimatedDocumentCount(),
      emergencyAlertModel.countDocuments({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      }),
      postModelSchema.countDocuments({ isDeleted: { $ne: true } }),
      userModel
        .find({}, "firstName lastName email studentId createdAt activeSessionId sessionExpiresAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
      lostModel
        .find({}, "title status createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
      foundModel
        .find({}, "title status createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
      eventModel
        .find({}, "title date createdAt venue")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
      notificationModel
        .find({}, "title category createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
      emergencyAlertModel
        .find({}, "title severity createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(5)
        .lean(),
    ]);

    const normalizeActivity = (items, type, metaBuilder) =>
      items.map((item) => ({
        id: String(item._id),
        type,
        title: item.title,
        timestamp: item.createdAt || item.date || new Date(),
        meta:
          typeof metaBuilder === "function"
            ? metaBuilder(item)
            : metaBuilder || {},
      }));

    const activityFeed = [
      ...normalizeActivity(recentLost, "lost", (item) => ({ status: item.status })),
      ...normalizeActivity(recentFound, "found", (item) => ({ status: item.status })),
      ...normalizeActivity(recentEvents, "event", (item) => ({
        venue: item.venue,
        date: item.date,
      })),
      ...normalizeActivity(recentAnnouncements, "announcement", (item) => ({ category: item.category })),
      ...normalizeActivity(recentAlerts, "alert", (item) => ({ severity: item.severity })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const formattedRecentUsers = recentUsers.map((user) => ({
      id: String(user._id),
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      studentId: user.studentId,
      joinedAt: user.createdAt || (user._id?.getTimestamp ? user._id.getTimestamp() : null),
      active: Boolean(
        user.activeSessionId && (!user.sessionExpiresAt || user.sessionExpiresAt > now)
      ),
    }));

    return res.status(200).json({
      success: true,
      summary: {
        users: { total: totalUsers, active: activeUsers },
        admins: { total: totalAdmins, active: activeAdmins },
        lostItems: { total: totalLostItems, open: openLostItems },
        foundItems: { total: totalFoundItems, open: openFoundItems },
        events: { total: totalEvents, upcoming: upcomingEvents },
        announcements: { total: totalAnnouncements },
        notes: { total: totalNotes },
        emergencyAlerts: { total: totalEmergencyAlerts, active: activeEmergencyAlerts },
        discussions: { total: totalDiscussions },
      },
      recentUsers: formattedRecentUsers,
      recentActivities: activityFeed,
    });
  } catch (error) {
    console.error("Admin overview error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin overview.",
      error: error.message,
    });
  }
});

adminDashboardRouter.get("/lost-items", adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 25), 500);

    const items = await lostModel
      .find(
        {},
        "title description location status dateLost contact image createdAt reportedBy"
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate({
        path: "reportedBy",
        select: "firstName lastName email studentId",
      })
      .lean();

    const formatted = items.map((item) => ({
      id: String(item._id),
      title: item.title,
      description: item.description,
      status: item.status,
      dateLost: item.dateLost,
      contact: item.contact,
      image: item.image,
      reportedAt: item.createdAt,
      reporter: item.reportedBy
        ? {
            name: `${item.reportedBy.firstName} ${item.reportedBy.lastName}`.trim(),
            email: item.reportedBy.email,
            studentId: item.reportedBy.studentId,
          }
        : null,
    }));

    return res.status(200).json({ success: true, items: formatted });
  } catch (error) {
    console.error("Admin lost-items error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load lost items.",
      error: error.message,
    });
  }
});

adminDashboardRouter.get("/found-items", adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 25), 500);

    const items = await foundModel
      .find(
        {},
        "title description locationFound status dateFound contact image createdAt reportedBy"
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate({
        path: "reportedBy",
        select: "firstName lastName email studentId",
      })
      .lean();

    const formatted = items.map((item) => ({
      id: String(item._id),
      title: item.title,
      description: item.description,
      status: item.status,
      dateFound: item.dateFound,
      contact: item.contact,
      image: item.image,
      reportedAt: item.createdAt,
      reporter: item.reportedBy
        ? {
            name: `${item.reportedBy.firstName} ${item.reportedBy.lastName}`.trim(),
            email: item.reportedBy.email,
            studentId: item.reportedBy.studentId,
          }
        : null,
    }));

    return res.status(200).json({ success: true, items: formatted });
  } catch (error) {
    console.error("Admin found-items error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load found items.",
      error: error.message,
    });
  }
});

adminDashboardRouter.get("/users", adminMiddleware, async (req, res) => {
  try {
    const now = new Date();

    const [totalUsers, userList, adminList] = await Promise.all([
      userModel.countDocuments({}),
      userModel
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .select("firstName lastName email studentId createdAt activeSessionId sessionExpiresAt")
        .lean(),
      adminModel
        .find({})
        .select("firstName lastName email adminCode activeSessionId sessionExpiresAt")
        .lean(),
    ]);

    const users = userList.map((user) => ({
      id: String(user._id),
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      studentId: user.studentId,
      joinedAt: user.createdAt || (user._id?.getTimestamp ? user._id.getTimestamp() : null),
      active: Boolean(
        user.activeSessionId && (!user.sessionExpiresAt || user.sessionExpiresAt > now)
      ),
    }));

    const admins = adminList.map((admin) => ({
      id: String(admin._id),
      name: `${admin.firstName} ${admin.lastName}`.trim(),
      email: admin.email,
      adminCode: admin.adminCode,
      createdAt:
        admin.createdAt || (admin._id?.getTimestamp ? admin._id.getTimestamp() : null),
      active: Boolean(
        admin.activeSessionId && (!admin.sessionExpiresAt || admin.sessionExpiresAt > now)
      ),
    }));

    return res.status(200).json({
      success: true,
      totalUsers,
      users,
      admins,
    });
  } catch (error) {
    console.error("Admin users fetch error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user directory.",
      error: error.message,
    });
  }
});

adminDashboardRouter.delete(
  "/announcements/:notificationId",
  adminMiddleware,
  validateParams(objectIdParamSchema("notificationId")),
  async (req, res) => {
    try {
      const deleted = await notificationModel.findByIdAndDelete(req.params.notificationId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Announcement deleted successfully.",
      });
    } catch (error) {
      console.error("Admin delete announcement error", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete announcement.",
        error: error.message,
      });
    }
  }
);

adminDashboardRouter.delete(
  "/events/:eventId",
  adminMiddleware,
  validateParams(objectIdParamSchema("eventId")),
  async (req, res) => {
    try {
      const deleted = await eventModel.findByIdAndDelete(req.params.eventId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Event not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Event deleted successfully.",
      });
    } catch (error) {
      console.error("Admin delete event error", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete event.",
        error: error.message,
      });
    }
  }
);

module.exports = {
  adminDashboardRouter,
};
