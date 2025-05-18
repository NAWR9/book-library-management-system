const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getPendingBorrowRequests,
  approveBorrowRequest,
  declineBorrowRequest,
} = require("../controllers/adminController");

// GET /api/admin/stats - Admin dashboard statistics
router.get("/stats", protect, authorize(["admin"]), getDashboardStats);

// GET pending borrow requests
router.get(
  "/requests/pending",
  protect,
  authorize(["admin"]),
  getPendingBorrowRequests,
);

// Approve a borrow request
router.patch(
  "/requests/:id/approve",
  protect,
  authorize(["admin"]),
  approveBorrowRequest,
);

// Decline a borrow request
router.patch(
  "/requests/:id/decline",
  protect,
  authorize(["admin"]),
  declineBorrowRequest,
);

module.exports = router;
