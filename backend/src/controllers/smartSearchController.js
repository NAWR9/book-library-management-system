const axios = require("axios");
require("dotenv").config();
const Book = require("../models/Book");

/**
 * Function to handle limited book queries using Groq's LLaMA model
 * @param {"about" | "author" | "similar"} userQuestion - Predefined user question
 * @param {string} bookTitle - Title of the book
 * @returns {Promise<string>} - LLM-generated response
 */
async function smartSearchBookInfo(userQuestion, bookTitle) {
  // Gather additional book context if available
  let bookContext = "";
  try {
    const book = await Book.findOne({
      title: new RegExp(`^${bookTitle}$`, "i"),
    }).lean();
    if (book) {
      const categories =
        (book.categories || [])
          .map((cat) => cat.replace(/_/g, " "))
          .join(", ") || "None";
      const desc =
        book.description_en ||
        book.description_ar ||
        "No description available.";
      bookContext = `Book Details:\nTitle: ${book.title}\nAuthor: ${book.author}\nCategories: ${categories}\nDescription: ${desc}\n\n`;
    }
  } catch (err) {
    console.error("Error fetching book context:", err);
  }

  let questionText = "";

  switch (userQuestion) {
    case "about":
      questionText = `Give a summary of the book titled "${bookTitle}".`;
      break;
    case "author":
      questionText = `Who is the author of the book titled "${bookTitle}"? Provide some background about them.`;
      break;
    case "similar":
      questionText = `Suggest 3 books similar to "${bookTitle}" and explain why they are similar.`;
      break;
    default:
      return "Invalid question type. Please choose from the predefined options.";
  }

  try {
    const messages = [];
    if (bookContext) {
      messages.push({ role: "system", content: bookContext });
    }
    messages.push({ role: "user", content: questionText });
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192", // or use "llama3-70b-8192"
        messages,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API error:", error.response?.data || error.message);
    return "Sorry, something went wrong while querying the AI.";
  }
}

module.exports = { smartSearchBookInfo };
