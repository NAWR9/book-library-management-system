const Book = require("../models/Book");
const BorrowRequest = require("../models/BorrowRequest");
const User = require("../models/User");
const { sendEmail } = require("../utils/sendEmail");

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
      returnDate: null,
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

// Controller to list active borrowed books (approved and not yet returned)
exports.getActiveLoans = async (req, res) => {
  try {
    const loans = await BorrowRequest.find({
      status: "approved",
      returnDate: null,
    })
      .sort({ dueDate: 1 })
      .populate("user", "name email phoneNumber")
      .populate("book", "title author");
    const formatted = loans.map((item) => ({
      id: item._id,
      user: item.user,
      book: item.book,
      requestDate: item.requestDate,
      dueDate: item.dueDate,
      daysRemaining: item.daysRemaining(),
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching active loans:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to mark a borrow request as returned
exports.returnBorrowRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    request.status = "returned";
    request.returnDate = new Date();
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) {
    console.error("Error returning borrow request:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to send reminder email for a loan
exports.sendLoanReminder = async (req, res) => {
  try {
    const loan = await BorrowRequest.findById(req.params.id)
      .populate("user", "email name")
      .populate("book", "title");
    if (!loan)
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    const userEmail = loan.user.email;
    const subject = `Reminder: Loan due ${new Date(loan.dueDate).toLocaleDateString()}`;
    const text = `Dear ${loan.user.name},\nYour loan for "${loan.book.title}" is due on ${new Date(loan.dueDate).toLocaleDateString()}. Please return or renew your loan.`;
    await sendEmail({
      to: userEmail,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, "<br>")}</p>`,
    });
    res.json({ success: true, message: "Reminder sent" });
  } catch (error) {
    console.error("Error sending loan reminder:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to renew a loan
exports.renewLoanRequest = async (req, res) => {
  try {
    const loan = await BorrowRequest.findById(req.params.id);
    if (!loan)
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    if (loan.renewalCount >= 3)
      return res
        .status(400)
        .json({ success: false, message: "Renewal limit reached" });
    loan.renewalCount += 1;
    // reset due date to now plus requested duration
    loan.dueDate = new Date(
      Date.now() + loan.requestedDuration * 24 * 60 * 60 * 1000,
    );
    await loan.save();
    res.json({ success: true, data: loan });
  } catch (error) {
    console.error("Error renewing loan:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to flag a loan as lost
exports.flagLoanLost = async (req, res) => {
  try {
    const loan = await BorrowRequest.findById(req.params.id);
    if (!loan)
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    loan.status = "lost";
    await loan.save();
    res.json({ success: true, data: loan });
  } catch (error) {
    console.error("Error flagging loan lost:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to flag a loan as damaged
exports.flagLoanDamaged = async (req, res) => {
  try {
    const loan = await BorrowRequest.findById(req.params.id);
    if (!loan)
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    loan.status = "damaged";
    await loan.save();
    res.json({ success: true, data: loan });
  } catch (error) {
    console.error("Error flagging loan damaged:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to list flagged loans (lost or damaged)
exports.getFlaggedLoans = async (req, res) => {
  try {
    const loans = await BorrowRequest.find({
      status: { $in: ["lost", "damaged"] },
    })
      .sort({ requestDate: -1 })
      .populate("user", "name email phoneNumber")
      .populate("book", "title author");
    const formatted = loans.map((item) => ({
      id: item._id,
      user: item.user,
      book: item.book,
      requestDate: item.requestDate,
      dueDate: item.dueDate,
      daysRemaining: item.daysRemaining(),
      status: item.status,
    }));
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching flagged loans:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
