/**
 * ─────────────────────────────────────────────
 *  controllers/settingsController.js — Settings
 * ─────────────────────────────────────────────
 *  Handles:
 *  - getSettings:    Get the user's settings
 *  - updateSettings: Update the user's settings
 *
 *  Each user has ONE settings document.
 *  If it doesn't exist yet, we create one with defaults.
 */

const Settings = require('../models/Settings');

// ─── GET SETTINGS ──────────────────────────────────────────
// GET /api/settings
const getSettings = async (req, res) => {
  try {
    // Try to find settings for this user
    let settings = await Settings.findOne({ user: req.user._id });

    // If no settings exist yet, create default ones
    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE SETTINGS ───────────────────────────────────────
// PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    // Find settings for this user
    let settings = await Settings.findOne({ user: req.user._id });

    // If no settings exist, create them first
    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    // Update only the fields that were sent
    // The ?? (nullish coalescing) operator keeps the old value
    // if the new value is null or undefined
    settings.theme = req.body.theme ?? settings.theme;
    settings.focusDuration = req.body.focusDuration ?? settings.focusDuration;
    settings.breakDuration = req.body.breakDuration ?? settings.breakDuration;
    settings.longBreakDuration = req.body.longBreakDuration ?? settings.longBreakDuration;
    settings.sessionsBeforeLongBreak = req.body.sessionsBeforeLongBreak ?? settings.sessionsBeforeLongBreak;
    settings.notifications = req.body.notifications ?? settings.notifications;
    settings.soundEnabled = req.body.soundEnabled ?? settings.soundEnabled;
    settings.autoStartBreaks = req.body.autoStartBreaks ?? settings.autoStartBreaks;
    settings.dailyGoalHours = req.body.dailyGoalHours ?? settings.dailyGoalHours;

    // Save to database
    const updatedSettings = await settings.save();

    res.json(updatedSettings);
  } catch (error) {
    console.error('Update settings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSettings, updateSettings };
