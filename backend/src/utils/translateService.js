/**
 * Translation Utility Service
 * Uses @vitalets/google-translate-api to translate text from English to Arabic
 */
const { translate } = require("@vitalets/google-translate-api");

/**
 * Translates text from English to Arabic
 * @param {string} text - The English text to translate
 * @returns {Promise<string>} - The translated Arabic text
 */
const translateToArabic = async (text) => {
  try {
    if (!text) return null;

    console.log(`Translating text to Arabic: "${text.substring(0, 50)}..."`);

    const result = await translate(text, { to: "ar" });
    console.log(
      `Translation successful, result: "${result.text.substring(0, 50)}..."`,
    );

    return result.text;
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return text;
  }
};

/**
 * Translates book details from English to Arabic
 * @param {Object} bookDetails - Book details object with English text
 * @returns {Promise<Object>} - Book details with Arabic translations
 */
const translateBookDetails = async (bookDetails) => {
  try {
    const result = { ...bookDetails };

    // Translate description if available
    if (bookDetails.description) {
      result.description_ar = await translateToArabic(bookDetails.description);
    }

    // Optionally translate other fields like title, author, etc.
    // Uncomment if you want to translate these fields
    /*
    if (bookDetails.title) {
      result.title_ar = await translateToArabic(bookDetails.title);
    }
    
    if (bookDetails.author) {
      result.author_ar = await translateToArabic(bookDetails.author);
    }
    */

    return result;
  } catch (error) {
    console.error("Error translating book details:", error);
    return bookDetails;
  }
};

module.exports = {
  translateToArabic,
  translateBookDetails,
};
