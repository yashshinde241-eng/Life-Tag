const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
  // roles can be "user", "doctor" or ["user","doctor"]
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // contains id and role
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access forbidden: insufficient rights" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

module.exports = authMiddleware;
