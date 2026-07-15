const openai = require("./openai");
const Note = require("../models/Note");

const AI_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Process a note with AI — generates summary, tags, and embedding.
 * Runs all three AI calls in parallel with a timeout and stale-guard.
 *
 * Stale-guard: atomically increments `processingVersion` before starting.
 * After AI calls complete, only writes results if the version hasn't been
 * incremented again (i.e., no newer processing run has started).
 *
 * @param {string} noteId - The MongoDB ObjectId of the note to process
 */
async function processNoteInsights(noteId) {
  let version;
  try {
    // Atomically increment processingVersion and capture the new value.
    // If a second call fires for the same note, it will increment again,
    // causing the first call's write-back check to fail gracefully.
    const updated = await Note.findByIdAndUpdate(
      noteId,
      { $inc: { processingVersion: 1 } },
      { new: true, select: "content processingVersion" }
    );

    if (!updated) {
      console.warn(`processNoteInsights: Note ${noteId} not found`);
      return;
    }

    version = updated.processingVersion;
    const content = updated.content;

    // AbortController for cancelling API calls on timeout
    const controller = new AbortController();
    const { signal } = controller;

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error(`AI processing timed out after ${AI_TIMEOUT_MS}ms`));
      }, AI_TIMEOUT_MS);
    });

    const aiPromise = Promise.all([
      // 1. Summarization
      openai.chat.completions.create(
        {
          model: "meta/llama-3.1-8b-instruct",
          max_tokens: 150,
          messages: [
            {
              role: "system",
              content:
                "Summarize the following note in 2–3 sentences. Be concise and direct.",
            },
            { role: "user", content },
          ],
        },
        { signal }
      ),

      // 2. Auto-tagging
      openai.chat.completions.create(
        {
          model: "meta/llama-3.1-8b-instruct",
          max_tokens: 100,
          messages: [
            {
              role: "system",
              content: `Extract 3 to 5 relevant short tags from the note.
Return ONLY a JSON object in this exact shape: {"tags": ["tag1", "tag2", "tag3"]}. Do not output any markdown code blocks, preamble, or explanations.`,
            },
            { role: "user", content },
          ],
        },
        { signal }
      ),

      // 3. Embedding (for semantic search)
      openai.embeddings.create(
        {
          model: "nvidia/llama-nemotron-embed-1b-v2",
          input: content,
          input_type: "passage",
        },
        { signal }
      ),
    ]);

    // Race the AI calls against the timeout
    const [summaryResult, tagsResult, embeddingResult] = await Promise.race([
      aiPromise,
      timeoutPromise,
    ]);

    // Parse summary
    const summary = summaryResult.choices[0].message.content.trim();

    // Parse tags
    let tags = [];
    try {
      let tagContent = tagsResult.choices[0].message.content.trim();
      if (tagContent.startsWith("```")) {
        tagContent = tagContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      }
      const parsed = JSON.parse(tagContent);
      tags = Array.isArray(parsed.tags) ? parsed.tags : [];
    } catch (parseErr) {
      console.warn("processNoteInsights: Failed to parse tags JSON:", parseErr.message);
    }

    const embedding = embeddingResult.data[0].embedding;

    // Stale-guard: only write results if processingVersion hasn't changed
    const writeResult = await Note.updateOne(
      { _id: noteId, processingVersion: version },
      {
        $set: {
          summary,
          tags,
          embedding,
          updatedAt: new Date(),
        },
      }
    );

    if (writeResult.matchedCount === 0) {
      console.log(
        `⏭️  Skipped stale AI write for note ${noteId} (version ${version} superseded)`
      );
    } else {
      console.log(`✅ AI processing complete for note: ${noteId}`);
    }
  } catch (err) {
    if (err.name === "AbortError" || err.message.includes("timed out")) {
      console.warn(`⏱️  AI processing timed out for note ${noteId}`);
    } else {
      // Error isolation — log but don't crash the server or corrupt the note
      console.error(`❌ processNoteInsights error for note ${noteId}:`, err.message);
    }
  }
}

module.exports = processNoteInsights;
