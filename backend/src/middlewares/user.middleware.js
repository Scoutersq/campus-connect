const jwt = require("jsonwebtoken");

function userMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "You are not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);

    req.userID = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

module.exports = { userMiddleware };
