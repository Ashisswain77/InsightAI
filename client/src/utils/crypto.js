/**
 * Client-side E2EE crypto utilities using the Web Crypto API.
 *
 * Uses AES-GCM (authenticated encryption) with keys derived from
 * a user-provided master password via SHA-256.
 *
 * The server never sees plaintext passwords or the encryption key.
 */

/**
 * Derive a CryptoKey from a master password string.
 * Uses SHA-256 to hash the password into a 256-bit key, then imports
 * it as an AES-GCM key for encrypt/decrypt operations.
 *
 * @param {string} masterPassword - The user's vault master password.
 * @returns {Promise<CryptoKey>} A CryptoKey suitable for AES-GCM.
 */
export async function deriveKey(masterPassword) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);

  // Hash the password to get exactly 32 bytes (256 bits)
  const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBytes);

  // Import the hash as an AES-GCM key
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false, // not extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext using AES-GCM.
 * Generates a random 12-byte IV per encryption.
 *
 * @param {string} plaintext - The text to encrypt.
 * @param {CryptoKey} key - The AES-GCM CryptoKey from deriveKey().
 * @returns {Promise<{ iv: string, ciphertext: string }>}
 *          iv and ciphertext are hex-encoded strings.
 */
export async function encryptText(plaintext, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    iv: bufferToHex(iv),
    ciphertext: bufferToHex(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * Decrypt ciphertext using AES-GCM.
 *
 * @param {string} ciphertextHex - Hex-encoded ciphertext (includes GCM auth tag).
 * @param {string} ivHex - Hex-encoded IV used during encryption.
 * @param {CryptoKey} key - The AES-GCM CryptoKey from deriveKey().
 * @returns {Promise<string>} The decrypted plaintext.
 * @throws {Error} If decryption fails (wrong key or tampered data).
 */
export async function decryptText(ciphertextHex, ivHex, key) {
  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(ciphertextHex);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

// --- Hex encoding helpers ---

function bufferToHex(buffer) {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
