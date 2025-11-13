const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const noteSharingRouter = Router();
const { noteSharingModel } = require("../../models/notesSharing.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateBody, validateParams } = require("../../utils/validation.js");

const uploadSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  subject: z.string().trim().min(2).max(80),
  fileUrl: z.string().trim().url().max(2048),
});

const withUpvoteCount = (note) => {
  if (!note) return note;

  const upvotes = Array.isArray(note.upvotedBy) ? note.upvotedBy.length : 0;
  return { ...note, upvotes };
};

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

noteSharingRouter.get("/all", userMiddleware, async (req, res) => {
  try {
    const notes = await noteSharingModel.find({}).lean();
    const formatted = notes.map(withUpvoteCount);

    return res.status(200).json({ success: true, notes: formatted });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
});

const noteIdParamsSchema = z.object({
  noteId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid note id."),
});

// Allow access when token belongs to the uploader (user) or an admin account.
const authorizeNoteOwnerOrAdmin = (req, res, next) => {
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

noteSharingRouter.get(
  "/:noteId",
  userMiddleware,
  validateParams(noteIdParamsSchema),
  async (req, res) => {
    try {
      const note = await noteSharingModel.findById(req.params.noteId).lean();

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found.",
        });
      }

      return res.status(200).json({ success: true, note: withUpvoteCount(note) });
    } catch (error) {
      console.error("Error fetching note:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
        error: error.message,
      });
    }
  }
);

noteSharingRouter.post(
  "/:noteId/upvote",
  userMiddleware,
  validateParams(noteIdParamsSchema),
  async (req, res) => {
    try {
      const updatedNote = await noteSharingModel
        .findOneAndUpdate(
          { _id: req.params.noteId, upvotedBy: { $ne: req.userID } },
          { $addToSet: { upvotedBy: req.userID } },
          { new: true }
        )
        .lean();

      if (updatedNote) {
        return res.status(200).json({
          success: true,
          message: "Note upvoted successfully.",
          note: withUpvoteCount(updatedNote),
        });
      }

      const existingNote = await noteSharingModel
        .findById(req.params.noteId)
        .lean();

      if (!existingNote) {
        return res.status(404).json({
          success: false,
          message: "Note not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Note already upvoted.",
        note: withUpvoteCount(existingNote),
      });
    } catch (error) {
      console.error("Error upvoting note:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
        error: error.message,
      });
    }
  }
);

noteSharingRouter.delete(
  "/:noteId",
  validateParams(noteIdParamsSchema),
  authorizeNoteOwnerOrAdmin,
  async (req, res) => {
    try {
      const note = await noteSharingModel.findById(req.params.noteId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found.",
        });
      }

      const isUploader = req.role === "user" && note.uploadedBy.toString() === req.userID;
      const isAdmin = req.role === "admin";

      if (!isUploader && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this note.",
        });
      }

      await note.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Note deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
        error: error.message,
      });
    }
  }
);

module.exports = { noteSharingRouter };
