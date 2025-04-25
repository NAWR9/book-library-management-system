const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", protect, getProfile);

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, password, phoneNumber, department } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (password) user.password = password; // Will be hashed by pre-save middleware
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;

    await user.save();

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      department: user.department,
    });
  } catch {
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

module.exports = router;
