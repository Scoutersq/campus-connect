const { Router } = require("express");
const { z } = require("zod");
const { lostModel } = require("../../models/lost.model.js");
const lostRouter = Router();
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { adminMiddleware } = require("../../middlewares/admin.middleware.js");
const { validateBody, validateParams } = require("../../utils/validation.js");
const { verifySessionToken, SessionError, extractTokenFromRequest } = require("../../utils/session.js");

const lostReportSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  location: z.string().trim().min(3).max(120),
  contact: z.string().trim().min(5).max(120),
  image: z.string().trim().url().max(2048).optional(),
  dateLost: z.coerce.date(),
});

const lostStatusUpdateSchema = z.object({
  status: z.enum(["claimed", "returned"]),
});

const itemIdParamsSchema = z.object({
  itemId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid item id."),
});

// Allow access when requester is the reporter (user) or an admin.
const authorizeReporterOrAdmin = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req, req.headers?.["x-portal-role"]);
    const session = await verifySessionToken(token);

    if (session.role === "admin") {
      req.role = "admin";
      req.adminID = session.id;
      return next();
    }

    if (session.role === "user") {
      req.role = "user";
      req.userID = session.id;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  } catch (error) {
    const statusCode = error instanceof SessionError ? error.statusCode : 403;
    const message = error instanceof SessionError ? error.message : "Invalid or expired token.";
    return res.status(statusCode).json({ success: false, message });
  }
};

lostRouter.post(
  "/report",
  userMiddleware,
  validateBody(lostReportSchema),
  async (req, res) => {
    try {
      const newLostItem = await lostModel.create({
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        contact: req.body.contact,
        image: req.body.image,
        dateLost: req.body.dateLost,
        reportedBy: req.userID,
      });

      return res.status(201).json({
        success: true,
        message: "Lost item reported successfully.",
        data: newLostItem,
      });
    } catch (error) {
      console.error("Error reporting lost item:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  }
);

lostRouter.get("/all", userMiddleware, async (req, res) => {
  try {
    const lostItems = await lostModel
      .find({}, "title description location contact image dateLost status createdAt reportedBy")
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    return res.status(200).json({ success: true, lostItems });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lost items.",
      error: error.message,
    });
  }
});

lostRouter.get("/preview", async (req, res) => {
  try {
    const { search = "", limit } = req.query;

    const filters = {};
    const projection = {
      title: 1,
      description: 1,
      location: 1,
      contact: 1,
      image: 1,
      dateLost: 1,
      status: 1,
      createdAt: 1,
      statusUpdatedAt: 1,
      reportedBy: 1,
    };

    if (typeof search === "string" && search.trim().length > 0) {
      filters.$text = { $search: search.trim() };
      projection.score = { $meta: "textScore" };
    }

    const query = lostModel.find(filters).select(projection);

    if (filters.$text) {
      query.sort({ score: { $meta: "textScore" }, createdAt: -1, _id: -1 });
    } else {
      query.sort({ createdAt: -1, _id: -1 });
    }

    const numericLimit = Number(limit);
    if (!Number.isNaN(numericLimit) && numericLimit > 0) {
      query.limit(Math.min(Math.max(Math.trunc(numericLimit), 10), 500));
    }

    const preview = await query.lean().exec();
    const sanitizedPreview = preview.map((entry) => {
      if (entry && typeof entry === "object" && "score" in entry) {
        const { score, ...rest } = entry;
        return rest;
      }
      return entry;
    });

    return res.status(200).json({ success: true, preview: sanitizedPreview });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lost items.",
      error: error.message,
    });
  }
});

lostRouter.get(
  "/:itemId",
  userMiddleware,
  validateParams(itemIdParamsSchema),
  async (req, res) => {
    try {
      const item = await lostModel
        .findById(req.params.itemId)
        .select(
          "title description location contact image dateLost status createdAt statusUpdatedAt reportedBy"
        )
        .lean();

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Lost item not found.",
        });
      }

      return res.status(200).json({ success: true, item });
    } catch (error) {
      console.error("Error fetching lost item:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  }
);

lostRouter.delete(
  "/:itemId",
  validateParams(itemIdParamsSchema),
  authorizeReporterOrAdmin,
  async (req, res) => {
    try {
      const item = await lostModel.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Lost item not found.",
        });
      }

      const isReporter = req.role === "user" && item.reportedBy?.toString() === req.userID;
      const isAdmin = req.role === "admin";

      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this lost item.",
        });
      }

      await item.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Lost item deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting lost item:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  }
);

lostRouter.patch(
  "/:itemId/status",
  validateParams(itemIdParamsSchema),
  authorizeReporterOrAdmin,
  validateBody(lostStatusUpdateSchema),
  async (req, res) => {
    try {
      const item = await lostModel.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Lost item not found.",
        });
      }

      const isReporter =
        req.role === "user" && item.reportedBy?.toString() === req.userID;
      const isAdmin = req.role === "admin";

      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this lost item.",
        });
      }

      if (item.status === req.body.status) {
        return res.status(200).json({
          success: true,
          message: `Status already marked as ${req.body.status}.`,
          data: item,
        });
      }

      item.status = req.body.status;
      item.statusUpdatedAt = new Date();
      await item.save();

      return res.status(200).json({
        success: true,
        message: "Lost item status updated successfully.",
        data: item,
      });
    } catch (error) {
      console.error("Error updating lost item status:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

module.exports = {
  lostRouter,
};
