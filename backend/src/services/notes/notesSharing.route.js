const { Router } = require("express");
const { z } = require("zod");
const noteSharingRouter = Router();
const { noteSharingModel } = require("../../models/notesSharing.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateBody } = require("../../utils/validation.js");

const uploadSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  subject: z.string().trim().min(2).max(80),
  fileUrl: z.string().trim().url().max(2048),
});

noteSharingRouter.post(
  "/upload",
  userMiddleware,
  validateBody(uploadSchema),
  async (req, res) => {
    try {
      const note = await noteSharingModel.create({
        title: req.body.title,
        description: req.body.description,
        subject: req.body.subject,
        fileUrl: req.body.fileUrl,
        uploadedBy: req.userID,
      });

      return res.status(201).json({
        success: true,
        message: "Note uploaded successfully.",
        note,
      });
    } catch (error) {
      console.error("Error uploading note:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
        error: error.message,
      });
    }
  }
);

module.exports = { noteSharingRouter };
