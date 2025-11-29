const { Router } = require("express");
const { verifySessionToken, clearActiveSession } = require("../../utils/session.js");

const authRouter = Router();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.token;

  if (token) {
    try {
      const session = await verifySessionToken(token);
      await clearActiveSession(session);
    } catch (_error) {
      // Ignore errors during logout; proceed to clear cookie.
    }
  }

  res.clearCookie("token", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = { authRouter };
