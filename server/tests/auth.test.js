const express = require("express");
const request = require("supertest");

// Mock environment variables
process.env.JWT_SECRET = "testsecret123";

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
      // Mock User.findOne to return null (no existing user)
      User.findOne.mockResolvedValue(null);
      // Mock User.create to return a mock user instance
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
      // Send an object as email/password instead of a string
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
});
