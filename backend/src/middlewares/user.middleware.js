const jwt = require("jsonwebtoken");

function userMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);

    if (decoded.role !== "user") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    req.userID = decoded.id;
    req.role = decoded.role;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
}

module.exports = { userMiddleware };
