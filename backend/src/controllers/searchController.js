const Book = require("../models/Book");

/**
 * Search books by title, author, genre, and category
 */
const searchBooks = async (req, res) => {
  try {
    const { title, author, genre, category } = req.query;
    let searchCriteria = {};

    if (title && author) {
      searchCriteria = {
        $and: [
          { title: new RegExp(title, "i") },
          { author: new RegExp(author, "i") },
        ],
      };
    } else {
      const conditions = [];

      if (title) {
        conditions.push({ title: new RegExp(title, "i") });
      }

      if (author) {
        conditions.push({ author: new RegExp(author, "i") });
      }

      if (genre && genre !== "All Genres") {
        conditions.push({ genre: new RegExp(genre, "i") });
      }

      if (category && category !== "All Categories") {
        conditions.push({ category: new RegExp(category, "i") });
      }

      if (conditions.length > 0) {
        searchCriteria = { $or: conditions };
      }
    }

    const books =
      Object.keys(searchCriteria).length > 0
        ? await Book.find(searchCriteria)
        : await Book.find({});

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      success: false,
      message: "Error performing search",
      error: error.message,
    });
  }
};

module.exports = {
  searchBooks,
};
