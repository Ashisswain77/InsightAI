const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Credential = require("../models/Credential");
const { validateId, sanitizeString, isHexString } = require("../middleware/validate");

const router = express.Router();

// Apply auth middleware to all locker routes
router.use(authMiddleware);

// GET /api/locker — Fetch all credentials for the logged-in user (raw, encrypted by client)
router.get("/", async (req, res) => {
  try {
    const credentials = await Credential.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });

    const result = credentials.map((cred) => ({
      _id: cred._id,
      title: cred.title,
      username: cred.username,
      encryptedPassword: cred.encryptedPassword,
      iv: cred.iv,
      category: cred.category,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("Fetch locker credentials error:", err.message);
    res.status(500).json({ message: "Failed to fetch locker credentials" });
  }
});

// POST /api/locker — Save a new credential (already encrypted by the client)
router.post("/", async (req, res) => {
  try {
    const { title, username, encryptedPassword, iv, category } = req.body;

    // Validate types
    if (
      typeof title !== "string" ||
      typeof encryptedPassword !== "string" ||
      typeof iv !== "string" ||
      (username !== undefined && typeof username !== "string") ||
      (category !== undefined && typeof category !== "string")
    ) {
      return res.status(400).json({ message: "Invalid input types" });
    }

    const cleanTitle = sanitizeString(title, 200);
    if (!cleanTitle) {
      return res.status(400).json({ message: "Title must be between 1 and 200 characters" });
    }

    if (!isHexString(encryptedPassword)) {
      return res.status(400).json({ message: "Invalid encrypted password format (must be hex)" });
    }

    if (!isHexString(iv)) {
      return res.status(400).json({ message: "Invalid IV format (must be hex)" });
    }

    const cleanUsername = username ? username.trim().substring(0, 200) : "";
    const cleanCategory = category ? sanitizeString(category, 50) || "General" : "General";

    const credential = await Credential.create({
      userId: req.user.id,
      title: cleanTitle,
      username: cleanUsername,
      encryptedPassword,
      iv,
      category: cleanCategory,
    });

    res.status(201).json({
      _id: credential._id,
      title: credential.title,
      username: credential.username,
      encryptedPassword: credential.encryptedPassword,
      iv: credential.iv,
      category: credential.category,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    });
  } catch (err) {
    console.error("Create credential error:", err.message);
    res.status(500).json({ message: "Failed to save credential" });
  }
});

// PUT /api/locker/:id — Update a credential (re-encrypted by the client if password changed)
router.put("/:id", validateId, async (req, res) => {
  try {
    const { title, username, encryptedPassword, iv, category } = req.body;

    // Validate input types if provided
    if (
      (title !== undefined && typeof title !== "string") ||
      (username !== undefined && typeof username !== "string") ||
      (encryptedPassword !== undefined && typeof encryptedPassword !== "string") ||
      (iv !== undefined && typeof iv !== "string") ||
      (category !== undefined && typeof category !== "string")
    ) {
      return res.status(400).json({ message: "Invalid input types" });
    }

    const credential = await Credential.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!credential) {
      return res.status(404).json({ message: "Credential not found" });
    }

    if (title !== undefined) {
      const cleanTitle = sanitizeString(title, 200);
      if (!cleanTitle) {
        return res.status(400).json({ message: "Title must be between 1 and 200 characters" });
      }
      credential.title = cleanTitle;
    }

    if (username !== undefined) {
      credential.username = username.trim().substring(0, 200);
    }

    if (category !== undefined) {
      credential.category = sanitizeString(category, 50) || "General";
    }

    if (encryptedPassword !== undefined || iv !== undefined) {
      if (encryptedPassword === undefined || iv === undefined) {
        return res.status(400).json({ message: "Both encryptedPassword and iv must be updated together" });
      }
      if (!isHexString(encryptedPassword)) {
        return res.status(400).json({ message: "Invalid encrypted password format (must be hex)" });
      }
      if (!isHexString(iv)) {
        return res.status(400).json({ message: "Invalid IV format (must be hex)" });
      }
      credential.encryptedPassword = encryptedPassword;
      credential.iv = iv;
    }

    credential.updatedAt = new Date();
    await credential.save();

    res.json({
      _id: credential._id,
      title: credential.title,
      username: credential.username,
      encryptedPassword: credential.encryptedPassword,
      iv: credential.iv,
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
router.delete("/:id", validateId, async (req, res) => {
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
