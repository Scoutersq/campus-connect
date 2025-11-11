const { Router } = require("express");
const { z } = require("zod");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { userModel } = require("../../models/user.model.js");
const { validateBody } = require("../../utils/validation.js");

const profileRouter = Router();

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(3).max(20).optional(),
    lastName: z.string().trim().min(2).max(10).optional(),
    avatarUrl: z.string().trim().url().max(2048).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

profileRouter.get("/me", userMiddleware, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.userID)
      .select("firstName lastName email avatarUrl")
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
        .select("firstName lastName email avatarUrl")
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

module.exports = { profileRouter };
