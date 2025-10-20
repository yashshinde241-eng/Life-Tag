// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (roles = []) => {
  // roles can be [] (any authenticated) or ["patient"], ["doctor"] etc.
  return (req, res, next) => {
    const header = req.headers["authorization"];
    if (!header) return res.status(401).json({ message: "No authorization header" });

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res.status(401).json({ message: "Invalid authorization format" });

    const token = parts[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role, iat, exp }
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

module.exports = authMiddleware;
