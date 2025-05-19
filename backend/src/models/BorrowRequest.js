const mongoose = require("mongoose");

const BorrowRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book reference is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "returned"],
      default: "pending",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    requestedDuration: {
      type: Number,
      default: 14, // Default to 14 days if not specified
      min: [1, "Minimum borrowing duration is 1 day"],
      max: [30, "Maximum borrowing duration is 30 days"],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    renewalCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3, // Limit renewals to 3 times
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lateReturnFee: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }, // Add timestamps for createdAt and updatedAt
);

// Virtual for checking if book is overdue
BorrowRequestSchema.virtual("isOverdue").get(function () {
  return (
    this.status === "approved" &&
    this.dueDate &&
    this.dueDate < new Date() &&
    !this.returnDate
  );
});

// Method to calculate days until due date or days overdue
BorrowRequestSchema.methods.daysRemaining = function () {
  if (!this.dueDate || this.status !== "approved" || this.returnDate) {
    return null;
  }

  const currentDate = new Date();
  const timeDiff = this.dueDate.getTime() - currentDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

module.exports = mongoose.model("BorrowRequest", BorrowRequestSchema);
