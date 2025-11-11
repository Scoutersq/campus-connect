const { Router } = require("express");
const { z } = require("zod");
const { lostModel } = require("../../models/lost.model.js");
const lostRouter = Router();
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { adminMiddleware } = require("../../middlewares/admin.middleware.js");
const { validateBody } = require("../../utils/validation.js");

const lostReportSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  location: z.string().trim().min(3).max(120),
  contact: z.string().trim().min(5).max(120),
  image: z.string().trim().url().max(2048).optional(),
  dateLost: z.coerce.date(),
});

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
    const lostItems = await lostModel.find({}).lean();
    return res.status(200).json({ success: true, lostItems });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lost items.",
      error: error.message,
    });
  }
});

lostRouter.get("/preview", adminMiddleware, async (req, res) => {
  try {
    const lostItems = await lostModel.find({}).lean();
    return res.status(200).json({ success: true, lostItems });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lost items.",
      error: error.message,
    });
  }
});

module.exports = {
  lostRouter,
};
