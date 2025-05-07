const Book = require("../models/Book");

const searchBooks = async (req, res) => {
  try {
    const { title, author, genre, category } = req.query;

    // Debug log
    console.log("Search params:", { title, author, genre, category });

    let searchCriteria = {};

    // Build search criteria based on provided parameters
    if (title && author) {
      // If both title and author are provided, search for books that match both
      searchCriteria = {
        $and: [
          { title: new RegExp(title, "i") },
          { author: new RegExp(author, "i") },
        ],
      };
    } else {
      // Build OR conditions for individual fields
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

      // If any conditions exist, use $or operator
      if (conditions.length > 0) {
        searchCriteria = { $or: conditions };
      }
    }

    // Debug log
    console.log("Search criteria:", searchCriteria);

    // If no search criteria (i.e., all fields empty or "All" selected), return all books
    const books =
      Object.keys(searchCriteria).length > 0
        ? await Book.find(searchCriteria)
        : await Book.find({});

    // Debug log
    console.log("Found books:", books);

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
