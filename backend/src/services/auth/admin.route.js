const { Router } = require("express");
const { adminModel } = require("../../models/admin.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { z } = require("zod");
const { validateBody } = require("../../utils/validation.js");
const {
  SESSION_TTL_MS,
  clearActiveSession,
  getBaseCookieOptions,
} = require("../../utils/session.js");
const { adminCodeModel } = require("../../models/adminCode.model.js");
const { normalizeAdminCode, allowedAdminCodes } = require("../../utils/adminCodes.js");

const adminRouter = Router();

const baseCookieOptions = getBaseCookieOptions();
const cookieOptions = {
  ...baseCookieOptions,
  maxAge: SESSION_TTL_MS,
};

const adminCodeSchema = z
  .string()
  .trim()
  .min(4)
  .max(10)
  .transform((value) => normalizeAdminCode(value))
  .refine((value) => allowedAdminCodes.includes(value), {
    message: "Please enter a valid admin code.",
  });

const adminSignupSchema = z.object({
  firstName: z.string().trim().min(3).max(20),
  lastName: z.string().trim().min(2).max(10),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(80),
  adminCode: adminCodeSchema,
});

const adminSigninSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(80),
  adminCode: adminCodeSchema,
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

    const adminCodeRecord = await adminCodeModel.findOne({ value: req.body.adminCode });

    if (!adminCodeRecord) {
      return res.status(400).json({
        success: false,
        message: "Admin code is not recognized.",
      });
    }

    if (adminCodeRecord.assignedAdmin) {
      return res.status(409).json({
        success: false,
        message: "This admin code is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newAdmin = await adminModel.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      adminCode: req.body.adminCode,
    });

    adminCodeRecord.assignedAdmin = newAdmin._id;
    adminCodeRecord.assignedAt = new Date();
    await adminCodeRecord.save({ validateBeforeSave: false });

    return res.status(201).json({ success: true, message: "Signup successful." });
  } catch (error) {
    let status = 500;
    let message = "Signup failed.";

    if (error?.code === 11000 && error?.keyPattern?.adminCode) {
      status = 409;
      message = "This admin code is already registered.";
    }

    return res.status(status).json({
      success: false,
      message,
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

    if (user.adminCode !== req.body.adminCode) {
      return res.status(403).json({ success: false, message: "Invalid credentials." });
    }

    const hasActiveSession = Boolean(
      user.activeSessionId && (!user.sessionExpiresAt || user.sessionExpiresAt > new Date())
    );

    if (hasActiveSession) {
      await clearActiveSession({ role: "admin", id: user._id });
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

    res.clearCookie("token", baseCookieOptions);
    res.cookie("admin_token", token, cookieOptions);

    const resetNotice = hasActiveSession
      ? "Signed in successfully. Previous session ended."
      : "Signed in successfully.";

    return res.status(200).json({ success: true, message: resetNotice, token });
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
