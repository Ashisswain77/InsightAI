const express = require("express");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const Note = require("../models/Note");
const openai = require("../utils/openai");
const processNoteInsights = require("../utils/processNoteInsights");

const router = express.Router();

// Apply auth middleware to all note routes
router.use(authMiddleware);

// Rate limit for semantic search (20 requests/minute per IP)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many search requests. Please try again later." },
});

// --- Cosine similarity helper ---
function cosineSimilarity(a, b) {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dot / magnitude;
}

// ============================================================
// IMPORTANT: /search must be defined BEFORE /:id
// Otherwise Express matches "search" as an :id parameter
// ============================================================

// GET /api/notes/search?q=... — Semantic search
router.get("/search", searchLimiter, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    // Step 1: Embed the search query
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: q.trim(),
    });
    const queryVec = embRes.data[0].embedding;

    // Step 2: Fetch all user notes that have embeddings
    const notes = await Note.find({
      userId: req.user.id,
      isArchived: { $ne: true },
      embedding: { $exists: true, $not: { $size: 0 } },
    }).select("title content summary tags embedding createdAt updatedAt");

    // Step 3: Score each note using cosine similarity
    const ranked = notes
      .map((n) => ({
        ...n.toObject(),
        score: cosineSimilarity(queryVec, n.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ embedding, ...rest }) => rest); // Strip raw vector

    res.json(ranked);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ message: "Search failed" });
  }
});

// GET /api/notes — Fetch all non-archived notes for the logged-in user
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id, isArchived: { $ne: true } })
      .select("-embedding")
      .sort({ updatedAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error("Fetch notes error:", err.message);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

// GET /api/notes/archived — Fetch all archived notes for the logged-in user
router.get("/archived", async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id, isArchived: true })
      .select("-embedding")
      .sort({ updatedAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error("Fetch archived notes error:", err.message);
    res.status(500).json({ message: "Failed to fetch archived notes" });
  }
});

// POST /api/notes — Create a new note
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const note = await Note.create({
      title: title.trim(),
      content,
      userId: req.user.id,
    });

    // Respond immediately — AI processing runs in background
    res.status(201).json(note);

    // Fire-and-forget AI processing (no await)
    processNoteInsights(note._id);
  } catch (err) {
    console.error("Create note error:", err.message);
    res.status(500).json({ message: "Failed to create note" });
  }
});

// GET /api/notes/:id — Fetch a single note
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select("-embedding");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    console.error("Fetch note error:", err.message);
    res.status(500).json({ message: "Failed to fetch note" });
  }
});

// PUT /api/notes/:id — Update a note
router.put("/:id", async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const contentChanged = content !== undefined && content !== note.content;
    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (req.body.isArchived !== undefined) note.isArchived = req.body.isArchived;
    note.updatedAt = new Date();

    await note.save();

    // Strip embedding from response
    const responseNote = note.toObject();
    delete responseNote.embedding;

    res.json(responseNote);

    // Re-trigger AI processing in background only if content changed
    if (contentChanged) {
      processNoteInsights(note._id);
    }
  } catch (err) {
    console.error("Update note error:", err.message);
    res.status(500).json({ message: "Failed to update note" });
  }
});

// DELETE /api/notes/:id — Delete a note
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete note error:", err.message);
    res.status(500).json({ message: "Failed to delete note" });
  }
});

module.exports = router;
