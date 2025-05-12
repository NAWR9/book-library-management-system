const crypto = require("crypto");

/**
 * Generate a secure random token
 * @returns {string} Random token in hex
 */
exports.generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
