const { Router } = require("express");
const { z } = require("zod");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { userModel } = require("../../models/user.model.js");
const { validateBody } = require("../../utils/validation.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const profileRouter = Router();

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(3).max(20).optional(),
    lastName: z.string().trim().min(2).max(10).optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) =>
          !value ||
          /^https?:\/\//i.test(value) ||
          value.startsWith("/uploads/") ||
          value.startsWith("uploads/"),
        "Avatar URL must be a valid link or stored upload path."
      )
      .optional(),
    phoneNumber: z.string().trim().max(20).optional(),
    bio: z.string().trim().max(400).optional(),
    academicYear: z.string().trim().max(40).optional(),
    department: z.string().trim().max(80).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

const uploadRootCandidates = [
  process.env.UPLOADS_DIR && path.resolve(process.cwd(), process.env.UPLOADS_DIR),
  path.resolve(__dirname, "../../../uploads"),
  path.resolve(process.cwd(), "uploads"),
  path.resolve(process.cwd(), "backend/uploads"),
].filter(Boolean);

const ensureDir = (target) => {
  try {
    fs.mkdirSync(target, { recursive: true });
    return true;
  } catch (_err) {
    return false;
  }
};

const uploadsRoot =
  uploadRootCandidates.find((dir) => ensureDir(dir)) || path.resolve(__dirname, "../../../uploads");

const avatarsDir = path.join(uploadsRoot, "avatars");
ensureDir(avatarsDir);

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname || "").toLowerCase()}`);
  },
});

const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only PNG, JPG, or WEBP images are allowed."));
  },
});

profileRouter.get("/me", userMiddleware, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.userID)
      .select("firstName lastName email avatarUrl phoneNumber bio academicYear department studentId")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      profile: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: error.message,
    });
  }
});

profileRouter.patch(
  "/me",
  userMiddleware,
  validateBody(updateProfileSchema),
  async (req, res) => {
    try {
      const updatedUser = await userModel
        .findByIdAndUpdate(
          req.userID,
          { $set: req.body },
          { new: true, runValidators: true, context: "query" }
        )
        .select("firstName lastName email avatarUrl phoneNumber bio academicYear department studentId")
        .lean();

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User profile not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        profile: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update profile.",
        error: error.message,
      });
    }
  }
);

profileRouter.post(
  "/avatar",
  userMiddleware,
  (req, res, next) => uploadAvatar.single("avatar")(req, res, (err) => {
    if (err) {
      const message = err?.message || "Invalid avatar upload.";
      return res.status(400).json({ success: false, message });
    }
    next();
  }),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Avatar image is required." });
      }

      const fileUrl = `/uploads/avatars/${req.file.filename}`;

      const updatedUser = await userModel
        .findByIdAndUpdate(
          req.userID,
          { $set: { avatarUrl: fileUrl } },
          { new: true, runValidators: true, context: "query" }
        )
        .select("firstName lastName email avatarUrl phoneNumber bio academicYear department studentId")
        .lean();

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User profile not found." });
      }

      return res.status(200).json({ success: true, profile: updatedUser, avatarUrl: fileUrl });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload avatar.",
        error: error.message,
      });
    }
  }
);

module.exports = { profileRouter };
