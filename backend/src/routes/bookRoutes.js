const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const {
  fetchAndUpdateBookDetails,
} = require("../controllers/bookDetailsController");

// @desc    Add a new book
// @route   POST /api/books
// @access  Admin
router.post("/", async (req, res) => {
  try {
    const {
      title,
      author,
      publicationDate,
      genre,
      description_en,
      description_ar,
      publisher,
      pageCount,
      isbn,
      coverImage,
      categories,
      bookCount,
      category,
    } = req.body;

    // Create the basic book
    // Create the basic book
    const book = await Book.create({
      title,
      author,
      publicationDate,
      genre: genre || "General",
      description_en: description_en || null,
      description_ar: description_ar || null,
      publisher: publisher || null,
      pageCount: pageCount || null,
      isbn: isbn || null,
      coverImage: coverImage || null,
      categories: categories || [],
      bookCount: bookCount || 1,
      category: category || "General",
      description_fetched: !!(description_en || description_ar), // Mark as fetched if either description exists
    });

    // If no descriptions were provided, try to fetch them automatically
    if (!description_en && !description_ar) {
      // Fetch book details from external API
      try {
        await fetchAndUpdateBookDetails(book);
        // Refetch the book to get the updated details
        const updatedBook = await Book.findById(book._id);
        res.status(201).json({ success: true, book: updatedBook });
      } catch (fetchError) {
        // Still return success even if fetch failed, we can try again later
        console.error("Failed to fetch book details:", fetchError);
        res.status(201).json({
          success: true,
          book,
          warning: "Book was created but descriptions could not be fetched",
        });
      }
    } else {
      // If descriptions were provided, just return the created book
      res.status(201).json({ success: true, book });
    }
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
    const { lang = "en" } = req.query;
    const books = await Book.find();

    // Map books to include the appropriate language description
    const formattedBooks = books.map((book) => {
      const bookObj = book.toObject();
      // Use the appropriate language description or fall back to the other one
      const description =
        lang === "ar"
          ? book.description_ar || book.description_en
          : book.description_en || book.description_ar;

      return {
        ...bookObj,
        description,
      };
    });

    res.status(200).json({ success: true, books: formattedBooks });
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
    const { lang = "en" } = req.query;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    // Check if we need to lazily fetch descriptions
    if (
      !book.description_fetched &&
      (book.description_en === null || book.description_ar === null)
    ) {
      try {
        await fetchAndUpdateBookDetails(book);
        // Get the updated book
        const updatedBook = await Book.findById(req.params.id);
        // Use the appropriate language description or fall back to the other
        const description =
          lang === "ar"
            ? updatedBook.description_ar || updatedBook.description_en
            : updatedBook.description_en || updatedBook.description_ar;

        const bookObj = updatedBook.toObject();
        res.status(200).json({
          success: true,
          book: { ...bookObj, description },
        });
      } catch (fetchError) {
        // If fetch failed, still return the book with whatever description it has
        console.error("Failed to fetch book details:", fetchError);
        const bookObj = book.toObject();
        const description =
          lang === "ar"
            ? book.description_ar || book.description_en
            : book.description_en || book.description_ar;

        res.status(200).json({
          success: true,
          book: { ...bookObj, description },
          warning: "Could not fetch complete book details",
        });
      }
    } else {
      // If descriptions are already fetched, just return the book
      const bookObj = book.toObject();
      const description =
        lang === "ar"
          ? book.description_ar || book.description_en
          : book.description_en || book.description_ar;

      res.status(200).json({
        success: true,
        book: { ...bookObj, description },
      });
    }
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
    const {
      title,
      author,
      publicationDate,
      genre,
      description_en,
      description_ar,
      publisher,
      pageCount,
      isbn,
      coverImage,
      categories,
      availability,
      bookCount,
      category,
    } = req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });
    }

    // Update fields if provided
    // Update fields if provided
    if (title) book.title = title;
    if (author) book.author = author;
    if (publicationDate) book.publicationDate = publicationDate;
    if (genre) book.genre = genre;
    if (description_en !== undefined) book.description_en = description_en;
    if (description_ar !== undefined) book.description_ar = description_ar;
    if (publisher !== undefined) book.publisher = publisher;
    if (pageCount !== undefined) book.pageCount = pageCount;
    if (isbn !== undefined) book.isbn = isbn;
    if (coverImage !== undefined) book.coverImage = coverImage;
    if (categories !== undefined) book.categories = categories;
    if (description_en !== undefined) book.description_en = description_en;
    if (description_ar !== undefined) book.description_ar = description_ar;
    if (publisher !== undefined) book.publisher = publisher;
    if (pageCount !== undefined) book.pageCount = pageCount;
    if (isbn !== undefined) book.isbn = isbn;
    if (coverImage !== undefined) book.coverImage = coverImage;
    if (categories !== undefined) book.categories = categories;
    if (availability !== undefined) book.availability = availability;
    if (bookCount !== undefined) book.bookCount = bookCount;
    if (category !== undefined) book.category = category;

    // If descriptions were updated, mark as fetched
    if (description_en !== undefined || description_ar !== undefined) {
      book.description_fetched = true;
    }

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
