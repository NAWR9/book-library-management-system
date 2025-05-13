const { translate } = require("@vitalets/google-translate-api");

/**
 * Sleep function to delay between retries
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Translate text with retry logic
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<string>} - Translated text or original text if translation fails
 */
// Track translation success rate for monitoring
const translationStats = {
  totalAttempts: 0,
  successCount: 0,
  failureCount: 0,
  lastFailure: null,
  rateLimitHits: 0,
};

const translateWithRetry = async (text, targetLang) => {
  if (!text) return null;

  translationStats.totalAttempts++;

  if (text.length > 5000) {
    text = text.substring(0, 5000) + "...";
  }

  try {
    if (text.length <= 3) {
      return text;
    }

    const result = await translate(text, { to: targetLang });
    translationStats.successCount++;
    return result.text;
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("429") ||
        error.message.includes("Too Many Requests"))
    ) {
      translationStats.rateLimitHits++;
      translationStats.failureCount++;
      return text;
    }

    // Try once more after a delay
    try {
      await sleep(500);
      const result = await translate(text, { to: targetLang });
      translationStats.successCount++;
      return result.text;
    } catch {
      translationStats.failureCount++;
      translationStats.lastFailure = new Date();
      return text;
    }
  }
};

const translateToArabic = async (text) => {
  return await translateWithRetry(text, "ar");
};

const translateToEnglish = async (text) => {
  return await translateWithRetry(text, "en");
};

const translateBookDetails = async (bookDetails) => {
  try {
    const result = { ...bookDetails };

    if (bookDetails.description) {
      const isArabic = (text) => {
        if (!text) return false;
        const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
        return arabicChars / text.length > 0.3;
      };

      if (isArabic(bookDetails.description)) {
        result.description_ar = bookDetails.description;
        result.description_en = await translateToEnglish(
          bookDetails.description,
        );
      } else {
        result.description_en = bookDetails.description;
        result.description_ar = await translateToArabic(
          bookDetails.description,
        );
      }
    }

    return result;
  } catch {
    return { ...bookDetails };
  }
};

/**
 * Get current translation service statistics
 * @returns {Object} - Translation service statistics
 */
const getTranslationStats = () => {
  return {
    ...translationStats,
    successRate:
      translationStats.totalAttempts > 0
        ? (
            (translationStats.successCount / translationStats.totalAttempts) *
            100
          ).toFixed(1)
        : 0,
  };
};

module.exports = {
  translateToArabic,
  translateToEnglish,
  translateBookDetails,
  getTranslationStats,
};
