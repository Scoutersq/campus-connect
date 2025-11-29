const { verifySessionToken, SessionError } = require("../utils/session.js");

async function userOrAdminMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;
    const session = await verifySessionToken(token);

    if (session.role === "admin") {
      req.role = "admin";
      req.adminID = session.id;
    } else if (session.role === "user") {
      req.role = "user";
      req.userID = session.id;
    } else {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    req.sessionId = session.sessionId;
    return next();
  } catch (error) {
    const statusCode = error instanceof SessionError ? error.statusCode : 403;
    const message = error instanceof SessionError ? error.message : "Invalid or expired token.";
    return res.status(statusCode).json({ success: false, message });
  }
}

module.exports = { userOrAdminMiddleware };
