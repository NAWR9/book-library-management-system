const express = require("express");
const router = express.Router();
const { translateToArabic } = require("../utils/translateService");

// Test endpoint for translation
router.get("/translate-test", async (req, res) => {
  try {
    const textToTranslate =
      req.query.text || "Hello, this is a test for Arabic translation.";

    console.log(`Translating text: "${textToTranslate}"`);

    const translatedText = await translateToArabic(textToTranslate);

    return res.status(200).json({
      success: true,
      original: textToTranslate,
      translated: translatedText,
    });
  } catch (error) {
    console.error("Translation test error:", error);
    return res.status(500).json({
      success: false,
      message: "Error testing translation",
      error: error.message,
    });
  }
});

module.exports = router;
