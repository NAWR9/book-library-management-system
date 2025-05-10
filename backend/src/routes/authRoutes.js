const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", protect, getProfile);

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, password, phoneNumber, department } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: req.t("auth.userNotFound"),
      });
    }
    if (name) user.name = name;
    if (password) user.password = password;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;
    await user.save();
    // regenerate token with updated name
    const newToken = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    // set new cookie
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      message: req.t("auth.profileUpdateSuccess"),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: req.t("auth.errorUpdatingProfile"),
      error: error.message,
    });
  }
});

module.exports = router;
