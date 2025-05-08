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
    default: Date.now,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  genre: {
    type: String,
    default: "General",
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
  categories: {
    type: [String],
    default: [],
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
  // Keep the legacy category field for backward compatibility
  category: {
    type: String,
    default: "General",
  },
  // Add main category reference
  mainCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
});

module.exports = mongoose.model("Book", BookSchema);
