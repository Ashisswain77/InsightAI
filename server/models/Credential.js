const mongoose = require("mongoose");

const credentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  username: {
    type: String,
    trim: true,
    default: "",
  },
  encryptedPassword: {
    type: String,
    required: [true, "Password/code is required"],
  },
  iv: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    trim: true,
    default: "General",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
credentialSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Credential", credentialSchema);
