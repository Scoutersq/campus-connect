const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { z } = require("zod");
const { userModel } = require("../../models/user.model.js");
const { validateBody } = require("../../utils/validation.js");
const {
  SESSION_TTL_MS,
  clearActiveSession,
  getBaseCookieOptions,
} = require("../../utils/session.js");
const { studentIdModel } = require("../../models/studentId.model.js");
const { normalizeStudentId, allowedStudentIds } = require("../../utils/studentIds.js");

const userRouter = Router();

const cookieOptions = {
  ...getBaseCookieOptions(),
  maxAge: SESSION_TTL_MS,
};

const studentIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(10)
  .transform((value) => normalizeStudentId(value))
  .refine((value) => allowedStudentIds.includes(value), {
    message: "Please enter a valid student ID.",
  });

const signupSchema = z.object({
  firstName: z.string().trim().min(3).max(20),
  lastName: z.string().trim().min(2).max(10),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6).max(80),
  studentId: studentIdSchema,
});

const signinSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6).max(80),
  studentId: studentIdSchema,
});

userRouter.post("/signup", validateBody(signupSchema), async (req, res) => {
  try {
    const existingUser = await userModel.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const studentRecord = await studentIdModel.findOne({ value: req.body.studentId });

    if (!studentRecord) {
      return res.status(400).json({
        success: false,
        message: "Student ID is not recognized.",
      });
    }

    if (studentRecord.assignedUser) {
      return res.status(409).json({
        success: false,
        message: "This student ID is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await userModel.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      studentId: req.body.studentId,
    });

    studentRecord.assignedUser = newUser._id;
    studentRecord.assignedAt = new Date();
    await studentRecord.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: "Sign up successful.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Signup failed.",
      error: error.message,
    });
  }
});

userRouter.post("/signin", validateBody(signinSchema), async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(403).json({ success: false, message: "Invalid credentials." });
    }

    if (user.studentId !== req.body.studentId) {
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
      await clearActiveSession({ role: "user", id: user._id });
    }

    const sessionId = randomUUID();
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const token = jwt.sign(
      {
        id: user._id,
        role: "user",
        sid: sessionId,
      },
      process.env.JWT_USER_SECRET,
      { expiresIn: "7d" }
    );

    user.activeSessionId = sessionId;
    user.sessionExpiresAt = sessionExpiresAt;
    await user.save({ validateBeforeSave: false });

    res.cookie("token", token, cookieOptions);

    const resetNotice = hasActiveSession
      ? "Signed in successfully. Previous session ended."
      : "Signed in successfully.";

    return res.status(200).json({ success: true, message: resetNotice });
  } catch (error) {
    let status = 500;
    let message = "Internal server error.";

    if (error?.code === 11000 && error?.keyPattern?.studentId) {
      status = 409;
      message = "This student ID is already registered.";
    }

    return res.status(status).json({
      success: false,
      message,
      error: error.message,
    });
  }
});

module.exports = {
  userRouter,
};
