const { Router } = require("express");
const { z } = require("zod");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const noteSharingRouter = Router();
const { noteSharingModel } = require("../../models/notesSharing.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { userOrAdminMiddleware } = require("../../middlewares/userOrAdmin.middleware.js");
const { validateParams } = require("../../utils/validation.js");
const { verifySessionToken, SessionError, extractTokenFromRequest } = require("../../utils/session.js");

const uploadSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  subject: z.string().trim().min(2).max(80),
});

const uploadsRoot = path.resolve(__dirname, "../../../uploads");
const notesUploadDir = path.join(uploadsRoot, "notes");
fs.mkdirSync(notesUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, notesUploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname || "").toLowerCase()}`);
  },
});

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (SUPPORTED_MIME_TYPES.has(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Only PDF or DOC/DOCX files are supported."), false);
  },
});

const formatUploader = (uploadedBy) => {
  if (!uploadedBy) return null;
  const plain = uploadedBy.toObject ? uploadedBy.toObject() : uploadedBy;
  const name = [plain.firstName, plain.lastName].filter(Boolean).join(" ");
  return {
    _id: plain._id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    name: name || plain.email || "Anonymous",
  };
};

const withUpvoteCount = (note) => {
  if (!note) return note;
  const plain = note.toObject ? note.toObject() : note;
  const upvotes = Array.isArray(plain.upvotedBy) ? plain.upvotedBy.length : 0;
  const noteId = plain._id?.toString?.() || String(plain._id || "");
  return {
    ...plain,
    upvotes,
    uploader: formatUploader(plain.uploadedBy),
    previewUrl: noteId ? `/api/notes/${noteId}/preview` : undefined,
    downloadUrl: noteId ? `/api/notes/${noteId}/download` : undefined,
  };
};

const uploadSingleNote = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const removeUploadedFile = (file) => {
  if (!file) return;
  const targetPath = file.path || (file.filename ? path.join(notesUploadDir, file.filename) : null);
  if (!targetPath) return;
  try {
    if (fs.existsSync(targetPath)) {
      fs.unlink(targetPath, () => {});
    }
  } catch (_err) {
    /* noop */
  }
};

noteSharingRouter.post("/upload", userMiddleware, uploadSingleNote, async (req, res) => {
  let parsedBody;
  try {
    parsedBody = uploadSchema.parse(req.body ?? {});
  } catch (error) {
    removeUploadedFile(req.file);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: error.errors?.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return res.status(400).json({ success: false, message: error.message });
  }

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A PDF or DOC/DOCX file is required.",
      });
    }

    const note = await noteSharingModel.create({
      title: parsedBody.title,
      description: parsedBody.description,
      subject: parsedBody.subject,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      storageName: req.file.filename,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.userID,
    });

    await note.populate("uploadedBy", "firstName lastName email");

    return res.status(201).json({
      success: true,
      message: "Note uploaded successfully.",
      note: withUpvoteCount(note),
    });
  } catch (error) {
    removeUploadedFile(req.file);
    console.error("Error uploading note:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
});

noteSharingRouter.get("/all", userOrAdminMiddleware, async (_req, res) => {
  try {
    const notes = await noteSharingModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "firstName lastName email")
      .lean({ virtuals: false });

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

const stripLeadingUploads = (value = "") => value.replace(/^uploads\//i, "");

const resolveNoteFilePath = (note) => {
  if (!note) {
    return null;
  }

  if (note.storageName) {
    return path.join(notesUploadDir, note.storageName);
  }

  const rawFileUrl = note.fileUrl || note.fileURL || note.file_path;

  if (typeof rawFileUrl !== "string" || rawFileUrl.length === 0) {
    return null;
  }

  const withoutProtocol = rawFileUrl.replace(/^https?:\/\/[^/]+/i, "").replace(/\\/g, "/");
  const normalized = withoutProtocol.replace(/^\/+/, "");

  if (!normalized.toLowerCase().startsWith("uploads/")) {
    return null;
  }

  const relative = stripLeadingUploads(normalized);
  if (!relative) {
    return null;
  }

  return path.join(notesUploadDir, relative);
};

const authorizeNoteOwnerOrAdmin = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);
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

    return res.status(403).json({ success: false, message: "Access denied." });
  } catch (error) {
    const statusCode = error instanceof SessionError ? error.statusCode : 403;
    const message = error instanceof SessionError ? error.message : "Invalid or expired token.";
    return res.status(statusCode).json({ success: false, message });
  }
};

noteSharingRouter.get(
  "/:noteId",
  userOrAdminMiddleware,
  validateParams(noteIdParamsSchema),
  async (req, res) => {
    try {
      const note = await noteSharingModel
        .findById(req.params.noteId)
        .populate("uploadedBy", "firstName lastName email")
        .lean();

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

noteSharingRouter.get(
  "/:noteId/preview",
  userOrAdminMiddleware,
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

      const filePath = resolveNoteFilePath(note);

      if (!filePath || !fs.existsSync(filePath)) {
        if (note.fileUrl) {
          return res.redirect(note.fileUrl);
        }
        return res.status(404).json({
          success: false,
          message: "File not available for preview.",
        });
      }

      res.setHeader("Content-Type", note.fileType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${note.fileName || note.storageName}"`
      );
      const stream = fs.createReadStream(filePath);
      stream.on("error", (streamError) => {
        console.error("Error streaming note preview:", streamError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Failed to load the note preview.",
          });
        } else {
          res.destroy(streamError);
        }
      });
      return stream.pipe(res);
    } catch (error) {
      console.error("Error previewing note:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
        error: error.message,
      });
    }
  }
);

noteSharingRouter.get(
  "/:noteId/download",
  userOrAdminMiddleware,
  validateParams(noteIdParamsSchema),
  async (req, res) => {
    try {
      const note = await noteSharingModel.findById(req.params.noteId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found.",
        });
      }

      const filePath = resolveNoteFilePath(note);

      const incrementDownload = async () => {
        try {
          note.downloads = (note.downloads || 0) + 1;
          await note.save();
        } catch (persistError) {
          console.error("Error updating download count:", persistError);
        }
      };

      if (!filePath || !fs.existsSync(filePath)) {
        await incrementDownload();
        if (note.fileUrl) {
          return res.redirect(note.fileUrl);
        }
        return res.status(404).json({
          success: false,
          message: "File not available for download.",
        });
      }

      await incrementDownload();

      res.setHeader("Content-Type", note.fileType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${note.fileName || note.storageName}"`
      );
      const stream = fs.createReadStream(filePath);
      stream.on("error", (streamError) => {
        console.error("Error streaming note download:", streamError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Failed to download the note.",
          });
        } else {
          res.destroy(streamError);
        }
      });
      return stream.pipe(res);
    } catch (error) {
      console.error("Error downloading note:", error);
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
        .populate("uploadedBy", "firstName lastName email")
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
        .populate("uploadedBy", "firstName lastName email")
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

      const filePath = resolveNoteFilePath(note);
      await note.deleteOne();

      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }

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
