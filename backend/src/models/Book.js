const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a book title"],
    trim: true,
  },
  author: {
    type: String,
    required: [true, "Please provide the author's name"],
    trim: true,
  },
  language: {
    type: String,
    required: [true, "Please specify the book language"],
    enum: ["english", "arabic"],
    default: "english",
  },
  publicationDate: {
    type: Date,
    required: [true, "Please provide the publication date"],
  },
  addedToLibraryDate: {
    type: Date,
    default: Date.now,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  description_en: {
    type: String,
    trim: true,
    default: null,
  },
  description_ar: {
    type: String,
    trim: true,
    default: null,
  },
  description_fetched: {
    type: Boolean,
    default: false,
  },
  publisher: {
    type: String,
    trim: true,
    default: null,
  },
  pageCount: {
    type: Number,
    default: null,
  },
  isbn: {
    type: String,
    trim: true,
    default: null,
  },
  coverImage: {
    type: String,
    default: null,
  },
  tags_en: {
    type: [String],
    default: [],
  },
  tags_ar: {
    type: [String],
    default: [],
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  borrowedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: null,
  },
  bookCount: {
    type: Number,
    required: true,
    default: 1,
    min: [1, "Book count must be at least 1"],
  },
});

// Calculate the number of available books (total count minus borrowed books)
BookSchema.methods.availableBooks = function () {
  const borrowedCount = this.borrowedBy ? this.borrowedBy.length : 0;
  return Math.max(0, this.bookCount - borrowedCount);
};

module.exports = mongoose.model("Book", BookSchema);
