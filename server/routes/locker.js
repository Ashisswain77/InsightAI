const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Credential = require("../models/Credential");
const { encrypt, decrypt } = require("../utils/crypto");

const router = express.Router();

// Apply auth middleware to all locker routes
router.use(authMiddleware);

// GET /api/locker — Fetch all credentials for the logged-in user (decrypted)
router.get("/", async (req, res) => {
  try {
    const credentials = await Credential.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });

    const decrypted = credentials.map((cred) => {
      let plaintextPassword = "";
      try {
        plaintextPassword = decrypt(cred.encryptedPassword, cred.iv);
      } catch (decErr) {
        console.error(`Failed to decrypt password for ID ${cred._id}:`, decErr.message);
        plaintextPassword = "[Decryption Failed]";
      }

      return {
        _id: cred._id,
        title: cred.title,
        username: cred.username,
        password: plaintextPassword,
        category: cred.category,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt,
      };
    });

    res.json(decrypted);
  } catch (err) {
    console.error("Fetch locker credentials error:", err.message);
    res.status(500).json({ message: "Failed to fetch locker credentials" });
  }
});

// POST /api/locker — Save a new credential (encrypted)
router.post("/", async (req, res) => {
  try {
    const { title, username, password, category } = req.body;

    if (!title || !password) {
      return res.status(400).json({ message: "Title and Password/Code are required" });
    }

    const { iv, encryptedText } = encrypt(password);

    const credential = await Credential.create({
      userId: req.user.id,
      title: title.trim(),
      username: (username || "").trim(),
      encryptedPassword: encryptedText,
      iv: iv,
      category: category || "General",
    });

    res.status(201).json({
      _id: credential._id,
      title: credential.title,
      username: credential.username,
      password: password, // Send plaintext password back to client for instant update
      category: credential.category,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    });
  } catch (err) {
    console.error("Create credential error:", err.message);
    res.status(500).json({ message: "Failed to save credential" });
  }
});

// PUT /api/locker/:id — Update a credential (re-encrypt password if changed)
router.put("/:id", async (req, res) => {
  try {
    const { title, username, password, category } = req.body;

    const credential = await Credential.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!credential) {
      return res.status(404).json({ message: "Credential not found" });
    }

    if (title !== undefined) credential.title = title.trim();
    if (username !== undefined) credential.username = username.trim();
    if (category !== undefined) credential.category = category || "General";

    let plaintextPassword = password;
    if (password !== undefined) {
      const { iv, encryptedText } = encrypt(password);
      credential.encryptedPassword = encryptedText;
      credential.iv = iv;
    } else {
      // Decrypt existing password for response
      try {
        plaintextPassword = decrypt(credential.encryptedPassword, credential.iv);
      } catch (decErr) {
        plaintextPassword = "[Decryption Failed]";
      }
    }

    credential.updatedAt = new Date();
    await credential.save();

    res.json({
      _id: credential._id,
      title: credential.title,
      username: credential.username,
      password: plaintextPassword,
      category: credential.category,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    });
  } catch (err) {
    console.error("Update credential error:", err.message);
    res.status(500).json({ message: "Failed to update credential" });
  }
});

// DELETE /api/locker/:id — Delete a credential
router.delete("/:id", async (req, res) => {
  try {
    const credential = await Credential.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!credential) {
      return res.status(404).json({ message: "Credential not found" });
    }

    res.json({ message: "Credential deleted successfully" });
  } catch (err) {
    console.error("Delete credential error:", err.message);
    res.status(500).json({ message: "Failed to delete credential" });
  }
});

module.exports = router;
