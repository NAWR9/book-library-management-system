const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getPendingBorrowRequests,
  approveBorrowRequest,
  declineBorrowRequest,
  getActiveLoans,
  returnBorrowRequest,
  sendLoanReminder,
  renewLoanRequest,
  flagLoanLost,
  flagLoanDamaged,
  getFlaggedLoans,
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

// GET active loans
router.get("/loans/active", protect, authorize(["admin"]), getActiveLoans);

// GET flagged loans (lost or damaged)
router.get("/loans/flagged", protect, authorize(["admin"]), getFlaggedLoans);

// Mark a loan as returned
router.patch(
  "/loans/:id/return",
  protect,
  authorize(["admin"]),
  returnBorrowRequest,
);

// Send reminder for a loan
router.post(
  "/loans/:id/reminder",
  protect,
  authorize(["admin"]),
  sendLoanReminder,
);

// Renew a loan
router.patch(
  "/loans/:id/renew",
  protect,
  authorize(["admin"]),
  renewLoanRequest,
);

// Flag loan as lost
router.patch("/loans/:id/lost", protect, authorize(["admin"]), flagLoanLost);

// Flag loan as damaged
router.patch(
  "/loans/:id/damaged",
  protect,
  authorize(["admin"]),
  flagLoanDamaged,
);

module.exports = router;
