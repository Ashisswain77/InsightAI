const openai = require("./openai");
const Note = require("../models/Note");

/**
 * Process a note with AI — generates summary, tags, and embedding.
 * Runs all three OpenAI calls in parallel via Promise.all.
 * Designed to be called fire-and-forget (no await at call site).
 *
 * @param {string} noteId - The MongoDB ObjectId of the note to process
 */
async function processNoteInsights(noteId) {
  try {
    const note = await Note.findById(noteId);
    if (!note) {
      console.warn(`processNoteInsights: Note ${noteId} not found`);
      return;
    }

    const [summaryResult, tagsResult, embeddingResult] = await Promise.all([
      // 1. Summarization
      openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
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

      // 2. Auto-tagging (request JSON and explicitly instruct Llama to return pure JSON)
      openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        max_tokens: 100,
        messages: [
          {
            role: "system",
            content: `Extract 3 to 5 relevant short tags from the note.
Return ONLY a JSON object in this exact shape: {"tags": ["tag1", "tag2", "tag3"]}. Do not output any markdown code blocks, preamble, or explanations.`,
          },
          { role: "user", content: note.content },
        ],
      }),

      // 3. Embedding (for semantic search)
      openai.embeddings.create({
        model: "nvidia/llama-nemotron-embed-1b-v2",
        input: note.content,
        input_type: "passage",
      }),
    ]);

    // Update note with AI-generated fields
    note.summary = summaryResult.choices[0].message.content.trim();

    try {
      let content = tagsResult.choices[0].message.content.trim();
      // Remove markdown code blocks if present (e.g. ```json ... ```)
      if (content.startsWith("```")) {
        content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      }
      const parsed = JSON.parse(content);
      note.tags = Array.isArray(parsed.tags) ? parsed.tags : [];
    } catch (parseErr) {
      console.warn("processNoteInsights: Failed to parse tags JSON:", parseErr.message);
      note.tags = [];
    }

    note.embedding = embeddingResult.data[0].embedding;
    note.updatedAt = new Date();

    await note.save();
    console.log(`✅ AI processing complete for note: ${noteId}`);
  } catch (err) {
    // Error isolation — log but don't crash the server or corrupt the note
    console.error(`❌ processNoteInsights error for note ${noteId}:`, err.message);
  }
}

module.exports = processNoteInsights;
