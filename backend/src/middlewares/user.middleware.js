const { verifySessionToken, SessionError } = require("../utils/session.js");

async function userMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;
    const session = await verifySessionToken(token, { expectedRole: "user" });
    req.userID = session.id;
    req.role = "user";
    req.sessionId = session.sessionId;
    next();
  } catch (error) {
    const statusCode = error instanceof SessionError ? error.statusCode : 403;
    const message = error instanceof SessionError ? error.message : "Invalid or expired token.";
    return res.status(statusCode).json({ success: false, message });
  }
}

module.exports = { userMiddleware };
