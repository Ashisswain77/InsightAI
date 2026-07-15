const { sanitizeString, isHexString, validateId } = require("../middleware/validate");

describe("validate.js Middlewares and Helper Functions", () => {
  describe("sanitizeString", () => {
    it("should return trimmed string for valid string input", () => {
      expect(sanitizeString("  hello world  ", 20)).toBe("hello world");
    });

    it("should return null if string exceeds maximum length", () => {
      expect(sanitizeString("a".repeat(21), 20)).toBeNull();
    });

    it("should return null for empty string or whitespace only", () => {
      expect(sanitizeString("   ", 10)).toBeNull();
      expect(sanitizeString("", 10)).toBeNull();
    });

    it("should return null for non-string inputs", () => {
      expect(sanitizeString(null, 10)).toBeNull();
      expect(sanitizeString(1234, 10)).toBeNull();
      expect(sanitizeString({}, 10)).toBeNull();
      expect(sanitizeString([], 10)).toBeNull();
    });
  });

  describe("isHexString", () => {
    it("should return true for valid even-length hex string", () => {
      expect(isHexString("abcdef0123456789")).toBe(true);
      expect(isHexString("ABCD")).toBe(true);
    });

    it("should return false for odd-length hex strings", () => {
      expect(isHexString("a")).toBe(false);
      expect(isHexString("abc")).toBe(false);
    });

    it("should return false for invalid hex characters", () => {
      expect(isHexString("abcdefg123")).toBe(false); // 'g' is invalid
      expect(isHexString("ab-cd")).toBe(false);
    });

    it("should return false for non-string inputs", () => {
      expect(isHexString(null)).toBe(false);
      expect(isHexString(123)).toBe(false);
      expect(isHexString({})).toBe(false);
    });
  });

  describe("validateId Middleware", () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
      mockReq = {
        params: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      nextFunction = jest.fn();
    });

    it("should call next() if req.params.id is a valid ObjectId", () => {
      mockReq.params.id = "60c72b2f9b1d8e1f5c8b4567"; // Valid 24-char hex
      validateId(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return 400 and JSON error if req.params.id is an invalid format", () => {
      mockReq.params.id = "short-invalid-id";
      validateId(mockReq, mockRes, nextFunction);
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid ID format" });
    });
  });
});
