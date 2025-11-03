const { Router } = require("express");
const { adminModel } = require("../models/admin.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const adminRouter = Router();

adminRouter.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 5);

    await adminModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    res.status(200).json({ message: "Signup successful" });
  } catch (e) {
    res.status(400).json({
      message: "Signup failed",
      error: e.message,
    });
  }
});

adminRouter.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await adminModel.findOne({ email });

  if (!user) {
    return res.status(403).json({ message: "Invalid credentials" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(403).json({ message: "Invalid credentials" });
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
  });

  return res.status(200).json({ message: "Signed in successfully" });
});


module.exports = {
  adminRouter,
};
