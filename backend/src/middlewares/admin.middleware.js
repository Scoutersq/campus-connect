const jwt = require("jsonwebtoken");

function adminMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "You are not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    req.adminID = decoded.id;
    req.role = decoded.role;
    

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired admin token" });
  }
}

module.exports = { adminMiddleware };