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
  publicationDate: {
    type: Date,
    required: [true, "Please provide the publication date"],
  },
  addedToLibraryDate: {
    type: Date,
    default: Date.now, // Automatically set to the current date when added
  },
  availability: {
    type: Boolean,
    default: true, // True if the book is available for borrowing
  },
  genre: {
    type: String,
    default: "General", // Optional field for book genre
  },
  description: {
    type: String,
    trim: true,
    default: null, // Optional field for a brief description of the book
  },
  borrowedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User", // Reference to the User model if the book is borrowed
    default: null,
  },
  bookCount: {
    type: Number,
    required: true,
    default: 1, // Default to 1 copy of the book
    min: [1, "Book count must be at least 1"],
  },
});

module.exports = mongoose.model("Book", BookSchema);
