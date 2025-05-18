const Book = require("../models/Book");
const BorrowRequest = require("../models/BorrowRequest");
const User = require("../models/User");

// Controller to get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total books count
    const totalBooks = await Book.countDocuments();

    // Total available books (sum of availableBooks method)
    const availableAgg = await Book.aggregate([
      {
        $project: {
          available: {
            $subtract: [
              "$bookCount",
              { $size: { $ifNull: ["$borrowedBy", []] } },
            ],
          },
        },
      },
      {
        $group: { _id: null, totalAvailable: { $sum: "$available" } },
      },
    ]);
    const availableBooks = availableAgg[0] ? availableAgg[0].totalAvailable : 0;

    // Total borrowed books (count of approved borrow requests)
    const borrowedBooks = await BorrowRequest.countDocuments({
      status: "approved",
    });

    // Borrow requests by status
    const requests = await BorrowRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const borrowRequestStatus = requests.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {
        pending: 0,
        approved: 0,
        declined: 0,
        returned: 0,
      },
    );

    // Total users
    const totalUsers = await User.countDocuments();

    // Book categories breakdown
    const categoriesAgg = await Book.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
    ]);
    const categories = categoriesAgg.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    res.json({
      totalBooks,
      availableBooks,
      borrowedBooks,
      borrowRequestStatus,
      totalUsers,
      categories,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to list pending borrow requests
exports.getPendingBorrowRequests = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({ status: "pending" })
      .sort({ requestDate: -1 })
      .populate("user", "name email phoneNumber")
      .populate("book", "title author");

    const formatted = requests.map((reqItem) => ({
      id: reqItem._id,
      user: reqItem.user,
      book: reqItem.book,
      requestDate: reqItem.requestDate,
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to approve a borrow request
exports.approveBorrowRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    request.status = "approved";
    request.approvedBy = req.user._id;
    request.dueDate = new Date(
      Date.now() + request.requestedDuration * 24 * 60 * 60 * 1000,
    );
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to decline a borrow request
exports.declineBorrowRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    request.status = "declined";
    request.approvedBy = req.user._id;
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) {
    console.error("Error declining request:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
