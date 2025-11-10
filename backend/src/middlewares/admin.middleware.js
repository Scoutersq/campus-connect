const jwt = require("jsonwebtoken");

function adminMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    req.adminID = decoded.id;
    req.role = decoded.role;

    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
}

module.exports = { adminMiddleware };