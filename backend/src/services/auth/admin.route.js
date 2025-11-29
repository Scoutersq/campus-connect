const { Router } = require("express");
const { adminModel } = require("../../models/admin.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { z } = require("zod");
const { validateBody } = require("../../utils/validation.js");
const { SESSION_TTL_MS } = require("../../utils/session.js");

const adminRouter = Router();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const adminSignupSchema = z.object({
  firstName: z.string().trim().min(3).max(20),
  lastName: z.string().trim().min(2).max(10),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(80),
});

const adminSigninSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(80),
});

adminRouter.post("/signup", validateBody(adminSignupSchema), async (req, res) => {
  try {
    const existingAdmin = await adminModel.findOne({ email: req.body.email });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "An admin with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await adminModel.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
    });

    return res.status(201).json({ success: true, message: "Signup successful." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Signup failed.",
      error: error.message,
    });
  }
});

adminRouter.post("/signin", validateBody(adminSigninSchema), async (req, res) => {
  try {
    const user = await adminModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(403).json({ success: false, message: "Invalid credentials." });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);

    if (!passwordMatch) {
      return res.status(403).json({ success: false, message: "Invalid credentials." });
    }

    const hasActiveSession = Boolean(
      user.activeSessionId && (!user.sessionExpiresAt || user.sessionExpiresAt > new Date())
    );

    if (hasActiveSession) {
      return res.status(409).json({
        success: false,
        message: "You are already signed in elsewhere. Please sign out before signing in again.",
      });
    }

    const sessionId = randomUUID();
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const token = jwt.sign(
      { id: user._id, role: "admin", sid: sessionId },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: "7d" }
    );

    user.activeSessionId = sessionId;
    user.sessionExpiresAt = sessionExpiresAt;
    await user.save({ validateBeforeSave: false });

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({ success: true, message: "Signed in successfully." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = {
  adminRouter,
};
