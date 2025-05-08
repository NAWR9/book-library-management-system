const axios = require("axios");
const Book = require("../models/Book");
const { translateToArabic } = require("../utils/translateService");

/**
 * Retrieves book details by ID, title, or author
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookDetails = async (req, res) => {
  try {
    const { title, author, lang = "en" } = req.query;
    const bookId = req.query.bookId;

    // If bookId is provided, try to get from database first
    if (bookId) {
      const bookDetails = await getBookDetailsById(bookId, lang);
      if (bookDetails) {
        return res.status(200).json({
          success: true,
          data: bookDetails,
        });
      }
    }

    // If no bookId or book not found, search by title and author
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required for book lookup",
      });
    }

    // First check if we have this book in our database
    const existingBook = await Book.findOne({
      title: new RegExp(title, "i"),
      ...(author && { author: new RegExp(author, "i") }),
    });

    if (existingBook) {
      const bookDetails = await processExistingBookDetails(existingBook, lang);
      return res.status(200).json({
        success: true,
        data: bookDetails,
      });
    }

    // If book not in database, fetch from API
    const bookDetails = await fetchBookDetailsFromApi(title, author, lang);

    if (!bookDetails) {
      return res.status(404).json({
        success: false,
        message: "No book details found",
      });
    }

    return res.status(200).json({
      success: true,
      data: bookDetails,
    });
  } catch (error) {
    console.error("Error fetching book details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching book details",
      error: error.message,
    });
  }
};

/**
 * Gets book details by ID and ensures descriptions are available
 * @param {string} bookId - The book ID to look up
 * @param {string} lang - The language code (en/ar)
 * @returns {Object|null} Book details object or null if not found
 */
const getBookDetailsById = async (bookId, lang) => {
  let book = await Book.findById(bookId);
  if (!book) return null;

  // Check if we need to do a lazy fetch for missing descriptions
  if (!book.description_fetched || book.description_en === null) {
    await fetchAndUpdateBookDetails(book);
    // Get updated book after fetching details
    const updatedBook = await Book.findById(book._id);
    book = updatedBook;
  }

  // Translate description to Arabic if needed
  if (book.description_en && !book.description_ar) {
    book.description_ar = await translateToArabic(book.description_en);
    book.description_fetched = true;
    await book.save();
  }

  // Return book with both descriptions and appropriate current language description
  const description =
    lang === "ar"
      ? book.description_ar || book.description_en
      : book.description_en || book.description_ar;
  return {
    ...book.toObject(),
    description,
    description_en: book.description_en,
    description_ar: book.description_ar,
    isbn: book.isbn,
    publishedDate: book.publicationDate,
  };
};

/**
 * Process an existing book from the database, ensuring it has complete details
 * @param {Object} existingBook - The book from the database
 * @param {string} lang - The language code (en/ar)
 * @returns {Object} Processed book details
 */
const processExistingBookDetails = async (existingBook, lang) => {
  // If we found the book but descriptions are not fetched, update them
  if (
    !existingBook.description_fetched ||
    existingBook.description_en === null
  ) {
    await fetchAndUpdateBookDetails(existingBook);
    // Refetch the updated book
    const updatedBook = await Book.findById(existingBook._id);

    // Translate description to Arabic if needed
    if (updatedBook.description_en && !updatedBook.description_ar) {
      updatedBook.description_ar = await translateToArabic(
        updatedBook.description_en,
      );
      updatedBook.description_fetched = true;
      await updatedBook.save();
    }

    // Get description based on current language
    const description =
      lang === "ar"
        ? updatedBook.description_ar || updatedBook.description_en
        : updatedBook.description_en || updatedBook.description_ar;

    return {
      ...updatedBook.toObject(),
      description,
      description_en: updatedBook.description_en,
      description_ar: updatedBook.description_ar,
      isbn: updatedBook.isbn,
      publishedDate: updatedBook.publicationDate,
    };
  }

  // Translate description to Arabic if needed
  if (existingBook.description_en && !existingBook.description_ar) {
    existingBook.description_ar = await translateToArabic(
      existingBook.description_en,
    );
    existingBook.description_fetched = true;
    await existingBook.save();
  }

  // Return existing book with appropriate language description
  const description =
    lang === "ar"
      ? existingBook.description_ar || existingBook.description_en
      : existingBook.description_en || existingBook.description_ar;

  return {
    ...existingBook.toObject(),
    description,
    description_en: existingBook.description_en,
    description_ar: existingBook.description_ar,
    isbn: existingBook.isbn,
    publishedDate: existingBook.publicationDate,
  };
};

/**
 * Fetches book details from Google Books API
 * @param {string} title - Book title
 * @param {string} author - Book author (optional)
 * @param {string} lang - Language code (en/ar)
 * @returns {Object|null} Book details or null if not found
 */
const fetchBookDetailsFromApi = async (title, author, lang) => {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  // Construct search query
  let searchQuery = `intitle:${encodeURIComponent(title)}`;
  if (author) {
    searchQuery += `+inauthor:${encodeURIComponent(author)}`;
  }

  // Fetch English description only
  const englishApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&langRestrict=en&key=${apiKey}`;
  const englishResponse = await axios.get(englishApiUrl);

  if (englishResponse.data.totalItems === 0) {
    return null;
  }

  // Extract book data from response
  const englishBookData =
    englishResponse.data.totalItems > 0
      ? englishResponse.data.items[0].volumeInfo
      : null;

  if (!englishBookData) {
    return null;
  }

  // Translate English description to Arabic
  const englishDescription = englishBookData?.description || null;
  const arabicDescription = englishDescription
    ? await translateToArabic(englishDescription)
    : null;

  // Get description based on current language
  const description =
    lang === "ar"
      ? arabicDescription || englishDescription
      : englishDescription || arabicDescription;

  // Extract ISBN
  let isbn = extractIsbnFromData(englishBookData);

  const bookDetails = {
    title: englishBookData.title,
    authors: englishBookData.authors || [],
    description,
    description_en: englishDescription,
    description_ar: arabicDescription,
    description_fetched: true,
    publishedDate: englishBookData.publishedDate,
    publicationDate: englishBookData.publishedDate,
    pageCount: englishBookData.pageCount,
    categories: englishBookData.categories || [],
    imageLinks: englishBookData.imageLinks || {},
    language: englishBookData.language,
    previewLink: englishBookData.previewLink,
    industryIdentifiers: englishBookData.industryIdentifiers || [],
    publisher: englishBookData.publisher,
    isbn,
  };

  // Create a book record in our database for future reference
  try {
    const newBook = new Book({
      title: englishBookData.title,
      author: englishBookData.authors ? englishBookData.authors[0] : "Unknown",
      publicationDate: englishBookData.publishedDate || new Date(),
      description_en: englishDescription,
      description_ar: arabicDescription,
      description_fetched: true,
      publisher: englishBookData.publisher || null,
      pageCount: englishBookData.pageCount || null,
      isbn: isbn,
      coverImage: englishBookData.imageLinks?.thumbnail || null,
      categories: englishBookData.categories || [],
      genre: englishBookData.categories?.[0] || "General",
    });

    await newBook.save();
    console.log("Book saved to database for future reference");
  } catch (saveError) {
    console.error("Error saving book to database:", saveError);
    // Continue with the response even if saving fails
  }

  return bookDetails;
};

/**
 * Helper function to extract ISBN from book data
 * @param {Object} bookData - The book data object
 * @returns {string|null} ISBN or null if not found
 */
const extractIsbnFromData = (bookData) => {
  if (!bookData.industryIdentifiers || !bookData.industryIdentifiers.length) {
    return null;
  }

  const isbnObj = bookData.industryIdentifiers.find(
    (id) => id.type === "ISBN_13" || id.type === "ISBN_10",
  );

  return isbnObj ? isbnObj.identifier : null;
};

/**
 * Helper function to fetch and update book descriptions
 * @param {Object} book - Book model instance
 * @returns {Object} Updated book object
 */
const fetchAndUpdateBookDetails = async (book) => {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    let searchQuery = `intitle:${encodeURIComponent(book.title)}`;

    if (book.author) {
      searchQuery += `+inauthor:${encodeURIComponent(book.author)}`;
    }

    // Only fetch English description
    const englishApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&langRestrict=en&key=${apiKey}`;
    const englishResponse = await axios.get(englishApiUrl);

    if (englishResponse.data.totalItems > 0) {
      const englishBookData = englishResponse.data.items[0].volumeInfo;
      book.description_en =
        englishBookData.description || book.description_en || null;

      // Update other metadata if available
      if (englishBookData.publisher && !book.publisher) {
        book.publisher = englishBookData.publisher;
      }
      if (englishBookData.pageCount && !book.pageCount) {
        book.pageCount = englishBookData.pageCount;
      }
      if (englishBookData.categories && englishBookData.categories.length > 0) {
        book.categories = englishBookData.categories;
      }
      if (
        englishBookData.industryIdentifiers &&
        englishBookData.industryIdentifiers.length > 0
      ) {
        const isbn = extractIsbnFromData(englishBookData);
        if (isbn && !book.isbn) {
          book.isbn = isbn;
        }
      }
      if (
        englishBookData.imageLinks &&
        englishBookData.imageLinks.thumbnail &&
        !book.coverImage
      ) {
        book.coverImage = englishBookData.imageLinks.thumbnail;
      }
    }

    // If we have English description, translate to Arabic
    if (book.description_en && !book.description_ar) {
      book.description_ar = await translateToArabic(book.description_en);
    }

    book.description_fetched = true;
    await book.save();
    return book;
  } catch (error) {
    console.error("Error fetching book details for update:", error);
    return book;
  }
};

module.exports = {
  getBookDetails,
  fetchAndUpdateBookDetails,
};
