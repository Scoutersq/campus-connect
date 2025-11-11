const { Router } = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const { userModel } = require("../../models/user.model.js");
const { validateParams } = require("../../utils/validation.js");

const usersRouter = Router();

const paramsSchema = z.object({
  userId: z
    .string()
    .trim()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: "Invalid user identifier provided.",
    }),
});

usersRouter.get(
  "/:userId",
  validateParams(paramsSchema),
  async (req, res) => {
    try {
      const profile = await userModel
        .findById(req.params.userId)
        .select("firstName lastName avatarUrl createdAt")
        .lean();

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        user: profile,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user profile.",
        error: error.message,
      });
    }
  }
);

module.exports = { usersRouter };
