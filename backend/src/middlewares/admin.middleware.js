const jwt = require("jsonwebtoken");

function adminMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "You are not logged in" });
    }

    // Verify token using the admin secret
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    // Ensure the token actually belongs to an admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Attach admin info to request
    req.adminID = decoded.id;
    req.role = decoded.role;

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired admin token" });
  }
}

module.exports = { adminMiddleware };