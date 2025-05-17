const axios = require("axios");
const Book = require("../models/Book");
const {
  translateToArabic,
  translateToEnglish,
} = require("../utils/translateService");
const {
  mapGoogleCategoriesToCategoryKeys,
} = require("../utils/categoryMapper");

/**
 * Checks if text is primarily written in Arabic
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text is primarily in Arabic
 */
const isArabicText = (text) => {
  if (!text) return false;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return arabicChars / text.length > 0.3;
};

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
 * Helper function to get book details by ID
 * @param {string} id - Book ID
 * @param {string} lang - Language code (en/ar)
 * @returns {Object|null} Book details or null if not found
 */
const getBookDetailsById = async (id, lang) => {
  try {
    const book = await Book.findById(id);
    if (!book) return null;

    // If descriptions are not fetched, update them
    if (!book.description_fetched) {
      await fetchAndUpdateBookDetails(book);
      // Refetch the book to get updated details
      const updatedBook = await Book.findById(id);
      return formatBookDetails(updatedBook, lang);
    }

    return formatBookDetails(book, lang);
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    return null;
  }
};

/**
 * Format book details based on language
 * @param {Object} book - Book model instance
 * @param {string} lang - Language code (en/ar)
 * @returns {Object} Formatted book details
 */
const formatBookDetails = (book, lang) => {
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

    // Translate description if needed
    if (updatedBook.description_en && !updatedBook.description_ar) {
      // If we have English but no Arabic, translate to Arabic
      try {
        const translatedArabic = await translateToArabic(
          updatedBook.description_en,
        );
        // Check if translation failed
        if (translatedArabic === updatedBook.description_en) {
          console.warn("Translation to Arabic failed, using original text");
        }
        updatedBook.description_ar = translatedArabic;
        updatedBook.description_fetched = true;
        await updatedBook.save();
      } catch (translateError) {
        console.error("Error translating English to Arabic:", translateError);
        updatedBook.description_ar = updatedBook.description_en; // Fallback to English
        updatedBook.description_fetched = true;
        await updatedBook.save();
      }
    } else if (updatedBook.description_ar && !updatedBook.description_en) {
      // If we have Arabic but no English, translate to English
      try {
        const translatedEnglish = await translateToEnglish(
          updatedBook.description_ar,
        );
        // Check if translation failed
        if (translatedEnglish === updatedBook.description_ar) {
          console.warn("Translation to English failed, using original text");
        }
        updatedBook.description_en = translatedEnglish;
        updatedBook.description_fetched = true;
        await updatedBook.save();
      } catch (translateError) {
        console.error("Error translating Arabic to English:", translateError);
        updatedBook.description_en = updatedBook.description_ar; // Fallback to Arabic
        updatedBook.description_fetched = true;
        await updatedBook.save();
      }
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

  // Handle translations for existing book
  if (existingBook.description_en && !existingBook.description_ar) {
    // If we have English but no Arabic, translate to Arabic
    try {
      const translatedArabic = await translateToArabic(
        existingBook.description_en,
      );
      // Check if translation failed
      if (translatedArabic === existingBook.description_en) {
        console.warn("Translation to Arabic failed, using original text");
      }
      existingBook.description_ar = translatedArabic;
      existingBook.description_fetched = true;
      await existingBook.save();
    } catch (translateError) {
      console.error("Error translating English to Arabic:", translateError);
      existingBook.description_ar = existingBook.description_en; // Fallback to English
      existingBook.description_fetched = true;
      await existingBook.save();
    }
  } else if (existingBook.description_ar && !existingBook.description_en) {
    // If we have Arabic but no English, translate to English
    try {
      const translatedEnglish = await translateToEnglish(
        existingBook.description_ar,
      );
      // Check if translation failed
      if (translatedEnglish === existingBook.description_ar) {
        console.warn("Translation to English failed, using original text");
      }
      existingBook.description_en = translatedEnglish;
      existingBook.description_fetched = true;
      await existingBook.save();
    } catch (translateError) {
      console.error("Error translating Arabic to English:", translateError);
      existingBook.description_en = existingBook.description_ar; // Fallback to Arabic
      existingBook.description_fetched = true;
      await existingBook.save();
    }
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
 * Helper to extract ISBN from Google Books API response
 * @param {Object} bookData - Book data from Google Books API
 * @returns {string|null} ISBN or null if not found
 */
const extractIsbnFromData = (bookData) => {
  if (!bookData.industryIdentifiers) return null;

  const isbnObj = bookData.industryIdentifiers.find(
    (id) => id.type === "ISBN_13" || id.type === "ISBN_10",
  );

  return isbnObj ? isbnObj.identifier : null;
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
  const bookData =
    englishResponse.data.totalItems > 0
      ? englishResponse.data.items[0].volumeInfo
      : null;

  if (!bookData) {
    return null;
  }

  // Check if the description is in Arabic
  const originalDescription = bookData?.description || null;
  let englishDescription = originalDescription;
  let arabicDescription = null;

  if (originalDescription) {
    if (isArabicText(originalDescription)) {
      try {
        const translatedText = await translateToEnglish(originalDescription);
        if (translatedText === originalDescription) {
          console.warn("Translation to English failed");
        }
        englishDescription = translatedText;
        arabicDescription = originalDescription;
      } catch (translateError) {
        console.error("Error translating Arabic to English:", translateError);
        englishDescription = originalDescription;
        arabicDescription = originalDescription;
      }
    } else {
      try {
        arabicDescription = await translateToArabic(originalDescription);
        if (arabicDescription === originalDescription) {
          console.warn("Translation to Arabic failed");
        }
      } catch (translateError) {
        console.error("Error translating English to Arabic:", translateError);
        arabicDescription = originalDescription;
      }
    }
  }

  // Get description based on current language
  const description =
    lang === "ar"
      ? arabicDescription || englishDescription
      : englishDescription || arabicDescription;

  // Extract ISBN
  let isbn = extractIsbnFromData(bookData);

  const bookDetails = {
    title: bookData.title,
    authors: bookData.authors || [],
    description,
    description_en: englishDescription,
    description_ar: arabicDescription,
    description_fetched: true,
    publishedDate: bookData.publishedDate,
    publicationDate: bookData.publishedDate,
    pageCount: bookData.pageCount,
    categories: bookData.categories || [],
    imageLinks: bookData.imageLinks || {},
    language: bookData.language,
    previewLink: bookData.previewLink,
    industryIdentifiers: bookData.industryIdentifiers || [],
    publisher: bookData.publisher,
    isbn,
  };

  // Create a book record in our database for future reference
  try {
    const newBook = new Book({
      title: bookData.title,
      author: bookData.authors ? bookData.authors[0] : "Unknown",
      language:
        bookData.language && bookData.language.toLowerCase() === "ar"
          ? "arabic"
          : "english",
      publicationDate: bookData.publishedDate || new Date(),
      description_en: englishDescription,
      description_ar: arabicDescription,
      description_fetched: true,
      publisher: bookData.publisher || null,
      pageCount: bookData.pageCount || null,
      isbn: isbn,
      coverImage: bookData.imageLinks?.thumbnail || null,
      categories: mapGoogleCategoriesToCategoryKeys(bookData.categories || []),
      genre: bookData.categories?.[0] || "General",
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
      const bookData = englishResponse.data.items[0].volumeInfo;
      const originalDescription =
        bookData.description || book.description_en || null;

      // Check if the description is in Arabic
      if (originalDescription && isArabicText(originalDescription)) {
        book.description_ar = originalDescription;
        try {
          const translatedText = await translateToEnglish(originalDescription);
          if (translatedText === originalDescription) {
            console.warn("Translation to English failed");
          }
          book.description_en = translatedText;
        } catch (translateError) {
          console.error("Error translating Arabic to English:", translateError);
          book.description_en = originalDescription;
        }
      } else {
        book.description_en = originalDescription;
      }

      // Update other metadata if available
      if (bookData.publisher && !book.publisher) {
        book.publisher = bookData.publisher;
      }
      if (bookData.pageCount && !book.pageCount) {
        book.pageCount = bookData.pageCount;
      }
      if (bookData.categories && bookData.categories.length > 0) {
        book.categories = bookData.categories;
      }
      if (
        bookData.industryIdentifiers &&
        bookData.industryIdentifiers.length > 0
      ) {
        const isbn = extractIsbnFromData(bookData);
        if (isbn && !book.isbn) {
          book.isbn = isbn;
        }
      }
      if (
        bookData.imageLinks &&
        bookData.imageLinks.thumbnail &&
        !book.coverImage
      ) {
        book.coverImage = bookData.imageLinks.thumbnail;
      }
    }

    // Handle translations based on available descriptions
    if (book.description_en && !book.description_ar) {
      // If we have English description but no Arabic, translate English to Arabic
      try {
        const translatedArabic = await translateToArabic(book.description_en);
        // Check if translation failed (returns the original text)
        if (translatedArabic === book.description_en) {
          console.warn("Translation to Arabic failed, using placeholder");
          // Use a placeholder message instead of the original English text
          book.description_ar = book.description_en;
        } else {
          book.description_ar = translatedArabic;
        }
      } catch (translateError) {
        console.error("Error translating English to Arabic:", translateError);
        // Use the English version as a fallback
        book.description_ar = book.description_en;
      }
    } else if (book.description_ar && !book.description_en) {
      // If we have Arabic description but no English, translate Arabic to English
      try {
        const translatedEnglish = await translateToEnglish(book.description_ar);
        // Check if translation failed (returns the original text)
        if (translatedEnglish === book.description_ar) {
          console.warn("Translation to English failed, using placeholder");
          // Use a placeholder message instead of the original Arabic text
          book.description_en = book.description_ar;
        } else {
          book.description_en = translatedEnglish;
        }
      } catch (translateError) {
        console.error("Error translating Arabic to English:", translateError);
        // Use the Arabic version as a fallback
        book.description_en = book.description_ar;
      }
    }

    book.description_fetched = true;
    await book.save();
    return book;
  } catch (error) {
    console.error("Error fetching book details for update:", error);
    return book;
  }
};

/**
 * Search Google Books API and return results
 * @route GET /api/books/search/google
 * @access Public
 */
const searchGoogleBooks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Missing search query (q)" });
    }
    const url = `https://www.googleapis.com/books/v1/volumes`;
    const params = {
      q,
      maxResults: 10,
      printType: "books",
    };

    console.log(`Searching Google Books API with query: ${q}`);
    const response = await axios.get(url, { params });

    // Extract the items array from the response
    const books = response.data.items || [];

    // Transform the data to a simpler format
    const formattedBooks = books.map((book) => {
      const volumeInfo = book.volumeInfo || {};
      return {
        id: book.id,
        title: volumeInfo.title || "Unknown Title",
        author: volumeInfo.authors
          ? volumeInfo.authors.join(", ")
          : "Unknown Author",
        publisher: volumeInfo.publisher || "",
        publication_date: volumeInfo.publishedDate || "",
        description: volumeInfo.description || "",
        page_count: volumeInfo.pageCount || 0,
        isbn: volumeInfo.industryIdentifiers
          ? volumeInfo.industryIdentifiers[0].identifier
          : "",
        cover_image: volumeInfo.imageLinks
          ? volumeInfo.imageLinks.thumbnail
          : "",
        tags: volumeInfo.categories || [],
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedBooks.length,
      data: formattedBooks,
    });
  } catch (error) {
    console.error("Error searching Google Books:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to search Google Books: ${error.response?.status || error.message}`,
      error: error.message,
    });
  }
};

module.exports = {
  getBookDetails,
  fetchAndUpdateBookDetails,
  searchGoogleBooks,
};
