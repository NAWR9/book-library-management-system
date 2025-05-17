const BorrowRequest = require("../models/BorrowRequest");
const Book = require("../models/Book");

/**
 * @desc    Create a new borrow request
 * @route   POST /api/borrow/request
 * @access  Private (Students only)
 */
exports.createBorrowRequest = async (req, res) => {
  try {
    const { bookId, requestedDuration } = req.body;
    const userId = req.user.id;

    // Validate request
    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }

    // Validate requested duration if provided
    if (requestedDuration !== undefined) {
      if (requestedDuration < 1 || requestedDuration > 30) {
        return res.status(400).json({
          success: false,
          message: "Requested duration must be between 1 and 30 days",
        });
      }
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if book is available
    if (!book.availability || book.availableBooks() <= 0) {
      return res.status(400).json({
        success: false,
        message: "Book is not available for borrowing",
      });
    }

    // Check if user already has a pending or approved request for this book
    const existingRequest = await BorrowRequest.findOne({
      user: userId,
      book: bookId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have an active request for this book",
      });
    }

    // Create new borrow request
    const borrowRequest = await BorrowRequest.create({
      user: userId,
      book: bookId,
      status: "pending",
      requestDate: Date.now(),
      requestedDuration: requestedDuration || 14, // Use default if not provided
    });

    res.status(201).json({
      success: true,
      message: "Borrow request submitted successfully",
      data: borrowRequest,
    });
  } catch (error) {
    console.error("Error creating borrow request:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing your request",
    });
  }
};

/**
 * @desc    Get user's borrow history
 * @route   GET /api/borrow/history
 * @access  Private (Students only)
 */
exports.getBorrowHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all borrow requests for the current user
    const borrowHistory = await BorrowRequest.find({ user: userId })
      .sort({ requestDate: -1 }) // Sort by requestDate in descending order (newest first)
      .populate({
        path: "book",
        select: "title author coverImage isbn publisher publicationDate", // Select specific book fields to return
      });

    // Map the borrow history to include formatted dates and duration info
    const formattedHistory = borrowHistory.map((request) => {
      return {
        _id: request._id,
        book: request.book,
        status: request.status,
        requestDate: request.requestDate,
        dueDate: request.dueDate,
        returnDate: request.returnDate,
        requestedDuration: request.requestedDuration || 14,
        notes: request.notes,
        formattedRequestDate: new Date(
          request.requestDate,
        ).toLocaleDateString(),
        formattedDueDate: request.dueDate
          ? new Date(request.dueDate).toLocaleDateString()
          : null,
        formattedReturnDate: request.returnDate
          ? new Date(request.returnDate).toLocaleDateString()
          : null,
        isOverdue:
          request.status === "approved" &&
          request.dueDate &&
          new Date(request.dueDate) < new Date() &&
          !request.returnDate,
      };
    });

    res.status(200).json({
      success: true,
      count: borrowHistory.length,
      data: formattedHistory,
    });
  } catch (error) {
    console.error("Error fetching borrow history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving borrow history",
    });
  }
};
