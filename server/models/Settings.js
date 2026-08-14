/**
 * ─────────────────────────────────────────────
 *  models/Settings.js — User Settings Schema
 * ─────────────────────────────────────────────
 *  Stores each user's personal preferences:
 *  timer durations, theme, notifications, etc.
 *
 *  There is ONE settings document per user.
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Link to the user who owns these settings
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,    // Each user has exactly ONE settings document
    },

    // ── Theme ────────────────────────────────
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark',
    },

    // ── Timer Durations (in minutes) ─────────
    focusDuration: {
      type: Number,
      default: 25,       // Classic Pomodoro = 25 minutes
    },
    breakDuration: {
      type: Number,
      default: 5,        // Short break = 5 minutes
    },
    longBreakDuration: {
      type: Number,
      default: 15,       // Long break = 15 minutes
    },
    sessionsBeforeLongBreak: {
      type: Number,
      default: 4,        // Take a long break after 4 focus sessions
    },

    // ── Notifications & Sound ────────────────
    notifications: {
      type: Boolean,
      default: true,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    autoStartBreaks: {
      type: Boolean,
      default: false,
    },

    // ── Goals ────────────────────────────────
    dailyGoalHours: {
      type: Number,
      default: 4,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
