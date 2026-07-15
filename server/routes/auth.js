const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sanitizeString } = require("../middleware/validate");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Simple email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Type checks — prevent NoSQL injection via objects like { "$gt": "" }
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input types" });
    }

    // Sanitize and validate
    const cleanName = sanitizeString(name, 100);
    if (!cleanName) {
      return res.status(400).json({ message: "Name is required (max 100 characters)" });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    if (password.length < 6 || password.length > 128) {
      return res
        .status(400)
        .json({ message: "Password must be between 6 and 128 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    // Sign JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Type checks — prevent NoSQL injection
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input types" });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Find user
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Sign JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/google — Verify Google Access Token and authenticate/register
router.post("/google", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (typeof accessToken !== "string" || !accessToken.trim()) {
      return res.status(400).json({ message: "Access token is required" });
    }

    // Call Google userinfo endpoint to verify token and get profile details
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ message: "Invalid or expired Google token" });
    }

    const googleUser = await response.json();
    const { email, name } = googleUser;

    if (!email) {
      return res.status(400).json({ message: "Google account does not provide an email" });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Generate a random password and hash it
      const randomPassword = require("crypto").randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create new user
      user = await User.create({
        name: (name || email.split("@")[0]).substring(0, 100),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });
    }

    // Sign JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Google Auth error:", err.message);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

// PUT /api/auth/profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Type checks
    if (typeof name !== "string" || typeof email !== "string") {
      return res.status(400).json({ message: "Invalid input types" });
    }

    const cleanName = sanitizeString(name, 100);
    if (!cleanName) {
      return res.status(400).json({ message: "Name is required (max 100 characters)" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    // Check if email already in use by another user
    const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use by another account" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = cleanName;
    user.email = cleanEmail;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
