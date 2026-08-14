/**
 * ─────────────────────────────────────────────
 *  models/Session.js — Focus Session Schema
 * ─────────────────────────────────────────────
 *  A "Session" is one focus or break period.
 *  Each session belongs to a specific user.
 *
 *  Example: A 25-minute focus session in the
 *  "study" category that was completed.
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    // Which user does this session belong to?
    // This links the session to a user in the "users" collection
    user: {
      type: mongoose.Schema.Types.ObjectId,  // Special ID type
      ref: 'User',                           // References the User model
      required: true,
    },

    // When did this session happen?
    date: {
      type: Date,
      default: Date.now,
    },

    // How long was the session (in minutes)?
    duration: {
      type: Number,
      required: true,
      default: 25,
    },

    // Was this a "focus" session or a "break"?
    type: {
      type: String,
      enum: ['focus', 'break'],   // Only allow these two values
      default: 'focus',
    },

    // Did the user complete the full session?
    completed: {
      type: Boolean,
      default: false,
    },

    // What category? (work, study, or personal)
    category: {
      type: String,
      enum: ['work', 'study', 'personal'],
      default: 'work',
    },
  },
  {
    timestamps: true,   // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Session', sessionSchema);
