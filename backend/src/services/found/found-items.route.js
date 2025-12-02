const { Router } = require("express");
const { z } = require("zod");
const foundRouter = Router();
const { foundModel } = require("../../models/found.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateBody, validateParams } = require("../../utils/validation.js");
const { verifySessionToken, SessionError, extractTokenFromRequest } = require("../../utils/session.js");

const foundReportSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  location: z.string().trim().min(3).max(120),
  date: z.coerce.date(),
  contact: z.string().trim().min(5).max(120),
  image: z.string().trim().url().max(2048).optional(),
});

const foundStatusUpdateSchema = z.object({
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

foundRouter.post(
  "/report",
  userMiddleware,
  validateBody(foundReportSchema),
  async (req, res) => {
    try {
      await foundModel.create({
        title: req.body.title,
        description: req.body.description,
        locationFound: req.body.location,
        dateFound: req.body.date,
        contact: req.body.contact,
        image: req.body.image,
        reportedBy: req.userID,
      });

      return res.status(201).json({
        success: true,
        message: "Found item reported successfully.",
      });
    } catch (error) {
      console.error("Error creating found item:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  }
);

foundRouter.get("/preview", async (req, res) => {
  try {
    const { search = "", limit } = req.query;

    const filters = {};
    const projection = {
      title: 1,
      description: 1,
      locationFound: 1,
      contact: 1,
      image: 1,
      dateFound: 1,
      status: 1,
      createdAt: 1,
      statusUpdatedAt: 1,
      reportedBy: 1,
    };

    if (typeof search === "string" && search.trim().length > 0) {
      filters.$text = { $search: search.trim() };
      projection.score = { $meta: "textScore" };
    }

    const query = foundModel.find(filters).select(projection);

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
      message: "Failed to fetch found items.",
      error: error.message,
    });
  }
});

foundRouter.get(
  "/:itemId",
  userMiddleware,
  validateParams(itemIdParamsSchema),
  async (req, res) => {
    try {
      const item = await foundModel
        .findById(req.params.itemId)
        .select(
          "title description locationFound contact image dateFound status createdAt statusUpdatedAt reportedBy"
        )
        .lean();

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Found item not found.",
        });
      }

      return res.status(200).json({ success: true, item });
    } catch (error) {
      console.error("Error fetching found item:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  }
);

foundRouter.delete(
  "/:itemId",
  validateParams(itemIdParamsSchema),
  authorizeReporterOrAdmin,
  async (req, res) => {
    try {
      const item = await foundModel.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Found item not found.",
        });
      }

      const isReporter = req.role === "user" && item.reportedBy?.toString() === req.userID;
      const isAdmin = req.role === "admin";

      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this found item.",
        });
      }

      await item.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Found item deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting found item:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message,
      });
    }
  }
);

foundRouter.patch(
  "/:itemId/status",
  validateParams(itemIdParamsSchema),
  authorizeReporterOrAdmin,
  validateBody(foundStatusUpdateSchema),
  async (req, res) => {
    try {
      const item = await foundModel.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Found item not found.",
        });
      }

      const isReporter =
        req.role === "user" && item.reportedBy?.toString() === req.userID;
      const isAdmin = req.role === "admin";

      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this found item.",
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
        message: "Found item status updated successfully.",
        data: item,
      });
    } catch (error) {
      console.error("Error updating found item status:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

module.exports = {
  foundRouter,
};
