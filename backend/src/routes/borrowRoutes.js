const express = require("express");
const {
  createBorrowRequest,
  getBorrowHistory,
} = require("../controllers/borrowController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/borrow/request
 * @desc    Create a new borrow request
 * @access  Private (Students only)
 */
router.post(
  "/request",
  protect,
  authorize(["user"]), // Only allow regular users (students), not admins
  createBorrowRequest,
);

/**
 * @route   GET /api/borrow/history
 * @desc    Get user's borrow history
 * @access  Private (Students only)
 */
router.get(
  "/history",
  protect,
  authorize(["user"]), // Only allow regular users (students), not admins
  getBorrowHistory,
);

module.exports = router;
