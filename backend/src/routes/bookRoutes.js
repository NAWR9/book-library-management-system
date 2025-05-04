const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// @desc    Add a new book
// @route   POST /api/books
// @access  Admin
router.post("/", async (req, res) => {
  try {
    const { title, author, publicationDate, genre, description } = req.body;

    const book = await Book.create({
      title,
      author,
      publicationDate,
      genre,
      description,
    });

    res.status(201).json({ success: true, book });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding book",
      error: error.message,
    });
  }
});

// @desc    Get all books
// @route   GET /api/books
// @access  Public
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json({ success: true, books });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching books",
      error: error.message,
    });
  }
});

// @desc    Get a single book by ID
// @route   GET /api/books/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    res.status(200).json({ success: true, book });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching book",
      error: error.message,
    });
  }
});

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Admin
router.put("/:id", async (req, res) => {
  try {
    const { title, author, publicationDate, genre, description, availability } =
      req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    // Update fields
    if (title) book.title = title;
    if (author) book.author = author;
    if (publicationDate) book.publicationDate = publicationDate;
    if (genre) book.genre = genre;
    if (description) book.description = description;
    if (availability !== undefined) book.availability = availability;

    await book.save();

    res.status(200).json({ success: true, book });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating book",
      error: error.message,
    });
  }
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Admin
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    await book.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting book",
      error: error.message,
    });
  }
});

module.exports = router;
