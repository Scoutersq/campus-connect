const { verifySessionToken, SessionError, extractTokenFromRequest } = require("../utils/session.js");

async function adminMiddleware(req, res, next) {
  try {
    const token = extractTokenFromRequest(req, "admin");
    const session = await verifySessionToken(token, { expectedRole: "admin" });
    req.adminID = session.id;
    req.role = "admin";
    req.sessionId = session.sessionId;
    next();
  } catch (error) {
    const statusCode = error instanceof SessionError ? error.statusCode : 403;
    const message = error instanceof SessionError ? error.message : "Invalid or expired token.";
    return res.status(statusCode).json({ success: false, message });
  }
}

module.exports = { adminMiddleware };