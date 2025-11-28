const { Router } = require("express");

const authRouter = Router();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

authRouter.post("/logout", (req, res) => {
  if (req.cookies?.token) {
    res.clearCookie("token", cookieOptions);
  } else {
    // Ensure the cookie is cleared even if the client deleted it manually.
    res.clearCookie("token", cookieOptions);
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = { authRouter };
