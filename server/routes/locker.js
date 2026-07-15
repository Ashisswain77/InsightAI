const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Credential = require("../models/Credential");

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

    if (!title || !encryptedPassword || !iv) {
      return res.status(400).json({ message: "Title, encrypted password, and IV are required" });
    }

    const credential = await Credential.create({
      userId: req.user.id,
      title: title.trim(),
      username: (username || "").trim(),
      encryptedPassword,
      iv,
      category: category || "General",
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
router.put("/:id", async (req, res) => {
  try {
    const { title, username, encryptedPassword, iv, category } = req.body;

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

    if (encryptedPassword !== undefined && iv !== undefined) {
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
