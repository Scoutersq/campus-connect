const { Router } = require("express");
const { z } = require("zod");
const foundRouter = Router();
const { foundModel } = require("../models/found.model.js");
const { userMiddleware } = require("../middlewares/user.middleware.js");
const { validateBody } = require("../utils/validation.js");

const foundReportSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  location: z.string().trim().min(3).max(120),
  date: z.coerce.date(),
  contact: z.string().trim().min(5).max(120),
  image: z.string().trim().url().max(2048).optional(),
});

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

module.exports = {
    foundRouter:foundRouter
}