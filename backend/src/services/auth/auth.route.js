const { Router } = require("express");
const {
  verifySessionToken,
  clearActiveSession,
  extractTokenFromRequest,
  getBaseCookieOptions,
} = require("../../utils/session.js");

const authRouter = Router();

const cookieOptions = getBaseCookieOptions();

authRouter.post("/logout", async (req, res) => {
  const token = extractTokenFromRequest(req, req.headers?.["x-portal-role"]);

  if (token) {
    try {
      const session = await verifySessionToken(token);
      await clearActiveSession(session);
    } catch (_error) {
      // Ignore errors during logout; proceed to clear cookie.
    }
  }

  ["token", "user_token", "admin_token"].forEach((name) => {
    res.clearCookie(name, cookieOptions);
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = { authRouter };
