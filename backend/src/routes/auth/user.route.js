const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { userModel } = require("../../models/user.model.js");
const { validateBody } = require("../../utils/validation.js");

const userRouter = Router();

const signupSchema = z.object({
    firstName: z.string().trim().min(3).max(20),
    lastName: z.string().trim().min(2).max(10),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(6).max(80),
});

const signinSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(6).max(80),
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

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        await userModel.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
        });

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

        const passwordMatch = await bcrypt.compare(req.body.password, user.password);

        if (!passwordMatch) {
            return res.status(403).json({ success: false, message: "Invalid credentials." });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: "user",
            },
            process.env.JWT_USER_SECRET,
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
    userRouter,
};