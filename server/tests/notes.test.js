const express = require("express");
const request = require("supertest");

// Mock environment variables
process.env.NVIDIA_API_KEY = "nvapi-testkey";

// Mock auth middleware to automatically authenticate as "user-123"
jest.mock("../middleware/authMiddleware", () => {
  return (req, res, next) => {
    req.user = { id: "user-123" };
    next();
  };
});

// Mock Note model and processNoteInsights utility
const Note = require("../models/Note");
jest.mock("../models/Note");

const processNoteInsights = require("../utils/processNoteInsights");
jest.mock("../utils/processNoteInsights");

// Import notes router
const notesRoutes = require("../routes/notes");

const app = express();
app.use(express.json());
app.use("/api/notes", notesRoutes);

describe("Notes Routes Hardening and Ownership Scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/notes", () => {
    it("should create a note with valid input", async () => {
      Note.create.mockResolvedValue({
        _id: "60c72b2f9b1d8e1f5c8b4567",
        title: "Test Title",
        content: "Test Content",
        userId: "user-123",
      });

      const res = await request(app)
        .post("/api/notes")
        .send({
          title: "Test Title",
          content: "Test Content",
        });

      expect(res.status).toBe(201);
      expect(Note.create).toHaveBeenCalledWith({
        title: "Test Title",
        content: "Test Content",
        userId: "user-123",
      });
      expect(processNoteInsights).toHaveBeenCalledWith("60c72b2f9b1d8e1f5c8b4567");
    });

    it("should reject input that is not string types", async () => {
      const res = await request(app)
        .post("/api/notes")
        .send({
          title: { $ne: "" },
          content: "Valid string content",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid input types");
      expect(Note.create).not.toHaveBeenCalled();
    });

    it("should reject titles exceeding 200 characters", async () => {
      const res = await request(app)
        .post("/api/notes")
        .send({
          title: "a".repeat(201),
          content: "Valid string content",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("between 1 and 200 characters");
      expect(Note.create).not.toHaveBeenCalled();
    });

    it("should reject content exceeding 50,000 characters", async () => {
      const res = await request(app)
        .post("/api/notes")
        .send({
          title: "Valid Title",
          content: "a".repeat(50001),
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("between 1 and 50,000 characters");
      expect(Note.create).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/notes/:id", () => {
    it("should scope update checks strictly to owner userId", async () => {
      const mockNote = {
        _id: "60c72b2f9b1d8e1f5c8b4567",
        title: "Old Title",
        content: "Old Content",
        userId: "user-123",
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: "60c72b2f9b1d8e1f5c8b4567",
          title: "New Title",
          content: "Old Content",
        }),
      };

      Note.findOne.mockResolvedValue(mockNote);

      const res = await request(app)
        .put("/api/notes/60c72b2f9b1d8e1f5c8b4567")
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(200);
      // Verify query includes BOTH note _id AND the authenticated user's userId
      expect(Note.findOne).toHaveBeenCalledWith({
        _id: "60c72b2f9b1d8e1f5c8b4567",
        userId: "user-123",
      });
      expect(mockNote.save).toHaveBeenCalled();
    });

    it("should return 404 if note does not exist or does not belong to the user", async () => {
      // Find returns null if not owner or not found
      Note.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/notes/60c72b2f9b1d8e1f5c8b4567")
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Note not found");
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("should scope delete checks strictly to owner userId", async () => {
      Note.findOneAndDelete.mockResolvedValue({
        _id: "60c72b2f9b1d8e1f5c8b4567",
      });

      const res = await request(app)
        .delete("/api/notes/60c72b2f9b1d8e1f5c8b4567");

      expect(res.status).toBe(200);
      expect(Note.findOneAndDelete).toHaveBeenCalledWith({
        _id: "60c72b2f9b1d8e1f5c8b4567",
        userId: "user-123",
      });
    });
  });
});
