const openai = require("./openai");
const Note = require("../models/Note");

/**
 * Process a note with AI — generates summary, tags, and embedding.
 * Runs all three OpenAI calls in parallel via Promise.all.
 * Designed to be called fire-and-forget (no await at call site).
 *
 * @param {string} noteId - The MongoDB ObjectId of the note to process
 */
async function processNoteAI(noteId) {
  try {
    const note = await Note.findById(noteId);
    if (!note) {
      console.warn(`processNoteAI: Note ${noteId} not found`);
      return;
    }

    const [summaryResult, tagsResult, embeddingResult] = await Promise.all([
      // 1. Summarization
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content:
              "Summarize the following note in 2–3 sentences. Be concise and direct.",
          },
          { role: "user", content: note.content },
        ],
      }),

      // 2. Auto-tagging (JSON mode for structured output)
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Extract 3 to 5 relevant short tags from the note.
Return ONLY a JSON object in this exact shape: {"tags": ["tag1", "tag2", "tag3"]}`,
          },
          { role: "user", content: note.content },
        ],
      }),

      // 3. Embedding (for semantic search)
      openai.embeddings.create({
        model: "text-embedding-3-small",
        input: note.content,
      }),
    ]);

    // Update note with AI-generated fields
    note.summary = summaryResult.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(tagsResult.choices[0].message.content);
      note.tags = Array.isArray(parsed.tags) ? parsed.tags : [];
    } catch (parseErr) {
      console.warn("processNoteAI: Failed to parse tags JSON:", parseErr.message);
      note.tags = [];
    }

    note.embedding = embeddingResult.data[0].embedding;
    note.updatedAt = new Date();

    await note.save();
    console.log(`✅ AI processing complete for note: ${noteId}`);
  } catch (err) {
    // Error isolation — log but don't crash the server or corrupt the note
    console.error(`❌ processNoteAI error for note ${noteId}:`, err.message);
  }
}

module.exports = processNoteAI;
