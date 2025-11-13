const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const foundRouter = Router();
const { foundModel } = require("../../models/found.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateBody, validateParams } = require("../../utils/validation.js");

const foundReportSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  location: z.string().trim().min(3).max(120),
  date: z.coerce.date(),
  contact: z.string().trim().min(5).max(120),
  image: z.string().trim().url().max(2048).optional(),
});

const itemIdParamsSchema = z.object({
  itemId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid item id."),
});

// Allow access when requester is the reporter (user) or an admin.
const authorizeReporterOrAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    } catch (adminError) {
      try {
        decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
      } catch (userError) {
        return res.status(403).json({
          success: false,
          message: "Invalid or expired token.",
        });
      }
    }

    if (decoded.role === "admin") {
      req.role = "admin";
      req.adminID = decoded.id;
      return next();
    }

    if (decoded.role === "user") {
      req.role = "user";
      req.userID = decoded.id;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
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
    const preview = await foundModel.find({}).lean();
    return res.status(200).json({ success: true, preview });
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
      const item = await foundModel.findById(req.params.itemId).lean();

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

module.exports = {
  foundRouter,
};
