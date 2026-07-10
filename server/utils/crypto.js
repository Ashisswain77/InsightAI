const crypto = require("crypto");

// Key must be 32 bytes for aes-256-cbc.
const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "default_backup_secret_key_32_chars_length";
// Derive a 32-byte key using sha256 to ensure it is exactly 32 bytes
const ENCRYPTION_KEY = crypto.createHash("sha256").update(secret).digest();

const ALGORITHM = "aes-256-cbc";

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: iv.toString("hex"),
    encryptedText: encrypted,
  };
}

function decrypt(encryptedText, ivHex) {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
