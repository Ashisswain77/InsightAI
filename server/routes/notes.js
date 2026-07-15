const express = require("express");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const Note = require("../models/Note");
const openai = require("../utils/openai");
const processNoteInsights = require("../utils/processNoteInsights");
const { validateId, sanitizeString } = require("../middleware/validate");

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
  if (!a || !b || a.length !== b.length) return 0;
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

// GET /api/notes/search?q=... — Semantic search (cursor-streamed, constant memory)
router.get("/search", searchLimiter, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    // Step 1: Embed the search query
    const embRes = await openai.embeddings.create({
      model: "nvidia/llama-nemotron-embed-1b-v2",
      input: q.trim(),
      input_type: "query",
    });
    const queryVec = embRes.data[0].embedding;

    // Step 2: Stream through notes one-at-a-time using a cursor
    // This avoids loading all embeddings into memory at once.
    const MAX_RESULTS = 5;
    const topResults = []; // maintained as a sorted array (descending by score)

    const cursor = Note.find({
      userId: req.user.id,
      isArchived: { $ne: true },
      isBinned: { $ne: true },
      embedding: { $exists: true, $not: { $size: 0 } },
    })
      .select("title content summary tags embedding createdAt updatedAt")
      .cursor();

    for await (const note of cursor) {
      const score = cosineSimilarity(queryVec, note.embedding);

      // Only consider if better than the worst result in our top-N, or if we have room
      if (topResults.length < MAX_RESULTS || score > topResults[topResults.length - 1].score) {
        const entry = {
          _id: note._id,
          title: note.title,
          content: note.content,
          summary: note.summary,
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          score,
        };

        // Insert in sorted position
        const insertIdx = topResults.findIndex((r) => score > r.score);
        if (insertIdx === -1) {
          topResults.push(entry);
        } else {
          topResults.splice(insertIdx, 0, entry);
        }

        // Trim to max size
        if (topResults.length > MAX_RESULTS) {
          topResults.pop();
        }
      }
    }

    res.json(topResults);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ message: "Search failed" });
  }
});

// GET /api/notes — Fetch all active notes (non-archived, non-binned) for the logged-in user
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user.id,
      isArchived: { $ne: true },
      isBinned: { $ne: true },
    })
      .select("-embedding")
      .sort({ updatedAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error("Fetch notes error:", err.message);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

// GET /api/notes/archived — Fetch all archived notes (non-binned) for the logged-in user
router.get("/archived", async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user.id,
      isArchived: true,
      isBinned: { $ne: true },
    })
      .select("-embedding")
      .sort({ updatedAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error("Fetch archived notes error:", err.message);
    res.status(500).json({ message: "Failed to fetch archived notes" });
  }
});

// GET /api/notes/binned — Fetch all binned notes for the logged-in user
router.get("/binned", async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id, isBinned: true })
      .select("-embedding")
      .sort({ updatedAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error("Fetch binned notes error:", err.message);
    res.status(500).json({ message: "Failed to fetch binned notes" });
  }
});

// DELETE /api/notes/binned/empty — Permanently delete all binned notes for the logged-in user
router.delete("/binned/empty", async (req, res) => {
  try {
    const result = await Note.deleteMany({
      userId: req.user.id,
      isBinned: true,
    });

    res.json({ message: `Successfully deleted all ${result.deletedCount} binned notes` });
  } catch (err) {
    console.error("Empty trash bin error:", err.message);
    res.status(500).json({ message: "Failed to empty trash bin" });
  }
});

// POST /api/notes — Create a new note
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (typeof title !== "string" || typeof content !== "string") {
      return res.status(400).json({ message: "Invalid input types" });
    }

    const cleanTitle = sanitizeString(title, 200);
    if (!cleanTitle) {
      return res.status(400).json({ message: "Title must be between 1 and 200 characters" });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 50000) {
      return res.status(400).json({ message: "Content must be between 1 and 50,000 characters" });
    }

    const note = await Note.create({
      title: cleanTitle,
      content: trimmedContent,
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
router.get("/:id", validateId, async (req, res) => {
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
router.put("/:id", validateId, async (req, res) => {
  try {
    const { title, content, isArchived, isBinned } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    let contentChanged = false;

    if (title !== undefined) {
      const cleanTitle = sanitizeString(title, 200);
      if (!cleanTitle) {
        return res.status(400).json({ message: "Title must be between 1 and 200 characters" });
      }
      note.title = cleanTitle;
    }

    if (content !== undefined) {
      if (typeof content !== "string") {
        return res.status(400).json({ message: "Content must be a string" });
      }
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0 || trimmedContent.length > 50000) {
        return res.status(400).json({ message: "Content must be between 1 and 50,000 characters" });
      }
      if (trimmedContent !== note.content) {
        contentChanged = true;
        note.content = trimmedContent;
      }
    }

    if (isArchived !== undefined) {
      if (typeof isArchived !== "boolean") {
        return res.status(400).json({ message: "isArchived must be a boolean" });
      }
      note.isArchived = isArchived;
    }

    if (isBinned !== undefined) {
      if (typeof isBinned !== "boolean") {
        return res.status(400).json({ message: "isBinned must be a boolean" });
      }
      note.isBinned = isBinned;
    }

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
router.delete("/:id", validateId, async (req, res) => {
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
