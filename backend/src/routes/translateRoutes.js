const express = require("express");
const router = express.Router();
const {
  translateToArabic,
  translateToEnglish,
  getTranslationStats,
} = require("../utils/translateService");
const { protect, authorize } = require("../middleware/authMiddleware");

/**
 * @desc    Translate text from English to Arabic
 * @route   POST /api/translate
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    const { text, source = "en", target = "ar" } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text to translate is required",
      });
    }

    let translation;
    let translationFailed = false;
    let translationWarning = null;

    if (source === "en" && target === "ar") {
      translation = await translateToArabic(text);
      if (translation === text) {
        translationFailed = true;
        translationWarning =
          "Translation service may be experiencing rate limits";
      }
    } else if (source === "ar" && target === "en") {
      translation = await translateToEnglish(text);
      if (translation === text) {
        translationFailed = true;
        translationWarning =
          "Translation service may be experiencing rate limits";
      }
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Only English-Arabic and Arabic-English translations are currently supported",
      });
    }

    if (translationFailed) {
      return res.status(200).json({
        success: true,
        translationFailed: true, // Explicitly mark that translation failed
        translation: text, // Return the original text
        original: text,
        warning:
          translationWarning ||
          "Translation service is currently experiencing issues. Using original text instead.",
      });
    }

    return res.status(200).json({
      success: true,
      translationFailed: false, // Explicitly mark that translation succeeded
      translation,
      original: text,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return res.status(500).json({
      success: false,
      translationFailed: true,
      message: "Error translating text",
      error: error.message,
      // Include a user-friendly message
      userMessage:
        "Translation service is currently experiencing issues. Please try again later.",
    });
  }
});

/**
 * @desc    Get translation service statistics
 * @route   GET /api/translate/stats
 * @access  Admin
 */
router.get("/stats", protect, authorize(["admin"]), (req, res) => {
  try {
    const stats = getTranslationStats();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving translation statistics",
      error: error.message,
    });
  }
});

// Translation test endpoint removed to reduce overhead

module.exports = router;
