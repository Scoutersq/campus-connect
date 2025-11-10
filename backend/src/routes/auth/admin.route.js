const { Router } = require("express");
const { adminModel } = require("../../models/admin.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { validateBody } = require("../../utils/validation.js");

const adminRouter = Router();

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

    const token = jwt.sign(
      { id: user._id, role: "admin" },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
