const { Router } = require("express");
const noteSharingRouter = Router();
const { noteSharingModel } = require("../models/notesSharing.model.js");
const { userMiddleware } = require("../middlewares/user.middleware.js");

noteSharingRouter.post("/upload", userMiddleware, async (req, res) => {
  try {
    const { title, description, subject, fileUrl } = req.body;

    // Validate input fields
    if (!title || !description || !subject || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "All fields (title, description, subject, fileUrl) are required.",
      });
    }

    const note = await noteSharingModel.create({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      fileUrl: fileUrl.trim(),
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
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

module.exports = { noteSharingRouter };
