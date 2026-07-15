const express = require("express");
const request = require("supertest");

// Mock environment variables
process.env.JWT_SECRET = "testsecret123";

// Mock auth middleware to automatically authenticate as "user-123"
jest.mock("../middleware/authMiddleware", () => {
  return (req, res, next) => {
    req.user = { id: "user-123" };
    next();
  };
});

// Import model and mock it
const User = require("../models/User");
jest.mock("../models/User");

// Import router
const authRoutes = require("../routes/auth");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth Routes Validation and Protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register successfully with valid inputs", async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: "60c72b2f9b1d8e1f5c8b4567",
        name: "Test User",
        email: "test@example.com",
      });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toEqual({
        id: "60c72b2f9b1d8e1f5c8b4567",
        name: "Test User",
        email: "test@example.com",
      });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        name: "Test User",
        email: "test@example.com",
      }));
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "not-an-email",
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("valid email");
      expect(User.create).not.toHaveBeenCalled();
    });

    it("should reject short passwords", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("6 and 128 characters");
      expect(User.create).not.toHaveBeenCalled();
    });

    it("should prevent NoSQL injection via object payloads", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: { $gt: "" },
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid input types");
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject NoSQL injection in login fields", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: { $gt: "" },
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid input types");
      expect(User.findOne).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/auth/profile", () => {
    it("should successfully update profile name and email", async () => {
      User.findOne.mockResolvedValue(null); // No email conflict
      const mockUserInstance = {
        _id: "user-123",
        name: "Old Name",
        email: "old@example.com",
        save: jest.fn().mockResolvedValue(true),
      };
      User.findById.mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .put("/api/auth/profile")
        .send({
          name: "New Name",
          email: "new@example.com",
        });

      expect(res.status).toBe(200);
      expect(User.findOne).toHaveBeenCalledWith({
        email: "new@example.com",
        _id: { $ne: "user-123" },
      });
      expect(User.findById).toHaveBeenCalledWith("user-123");
      expect(mockUserInstance.name).toBe("New Name");
      expect(mockUserInstance.email).toBe("new@example.com");
      expect(mockUserInstance.save).toHaveBeenCalled();
      expect(res.body).toEqual({
        id: "user-123",
        name: "New Name",
        email: "new@example.com",
      });
    });

    it("should reject profile update with invalid email format", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .send({
          name: "New Name",
          email: "invalid-email-format",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("valid email");
      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should reject profile update if email is taken by another account", async () => {
      User.findOne.mockResolvedValue({ _id: "other-user-999", email: "conflict@example.com" });

      const res = await request(app)
        .put("/api/auth/profile")
        .send({
          name: "New Name",
          email: "conflict@example.com",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already in use");
      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should prevent NoSQL injection via object payloads in profile update", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .send({
          name: "New Name",
          email: { $ne: "" },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid input types");
      expect(User.findOne).not.toHaveBeenCalled();
    });
  });
});
