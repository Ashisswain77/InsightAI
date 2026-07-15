const mongoose = require("mongoose");

/**
 * Sanitize and trim a string value, enforcing a maximum length.
 *
 * @param {*} val - The value to sanitize.
 * @param {number} maxLen - Maximum allowed length after trimming.
 * @returns {string|null} The sanitized string, or null if invalid.
 */
function sanitizeString(val, maxLen) {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return null;
  return trimmed;
}

/**
 * Check if a string is a valid MongoDB ObjectId.
 *
 * @param {string} id - The ID to validate.
 * @returns {boolean}
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Express middleware that validates the :id route parameter.
 * Returns 400 if the ID is not a valid MongoDB ObjectId,
 * preventing Mongoose CastError crashes downstream.
 */
function validateId(req, res, next) {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  next();
}

/**
 * Check if a string is a valid hex-encoded value (non-empty, even length, [0-9a-fA-F]).
 *
 * @param {*} val - The value to check.
 * @returns {boolean}
 */
function isHexString(val) {
  if (typeof val !== "string" || val.length === 0 || val.length % 2 !== 0) return false;
  return /^[0-9a-fA-F]+$/.test(val);
}

module.exports = { sanitizeString, isValidObjectId, validateId, isHexString };
