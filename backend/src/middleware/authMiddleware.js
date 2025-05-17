const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to protect routes - validates user authentication
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // If no token in header, check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id && decoded.role) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
      };
    } else {
      req.user = await User.findById(decoded.id);
    }

    next();
  } catch (error) {
    console.error("Auth token verification error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
