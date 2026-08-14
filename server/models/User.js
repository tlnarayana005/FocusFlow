/**
 * ─────────────────────────────────────────────
 *  models/User.js — User Schema
 * ─────────────────────────────────────────────
 *  Defines what a "User" looks like in our
 *  MongoDB database using Mongoose.
 *
 *  Each user has:
 *  - name, email, password  (for auth)
 *  - goalHours, streak, focusScore, screenTime (for productivity tracking)
 *  - joinDate (auto-set when account is created)
 */

const mongoose = require('mongoose');

// A "Schema" is like a blueprint for our data
const userSchema = new mongoose.Schema(
  {
    // ── Auth Fields ──────────────────────────
    name: {
      type: String,
      required: [true, 'Please add a name'],  // Custom error message
      trim: true,                              // Removes extra spaces
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,           // No two users can have the same email
      lowercase: true,        // Automatically converts to lowercase
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,           // At least 6 characters
    },

    // ── Profile / Productivity Fields ────────
    goalHours: {
      type: Number,
      default: 4,             // Default daily focus goal = 4 hours
    },
    focusScore: {
      type: Number,
      default: 0,
    },
    screenTime: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    joinDate: {
      type: Date,
      default: Date.now,      // Automatically set to current date
    },
  },
  {
    // "timestamps" adds createdAt and updatedAt fields automatically
    timestamps: true,
  }
);

// Create the model from the schema and export it
// "User" → MongoDB will create a collection called "users"
module.exports = mongoose.model('User', userSchema);
