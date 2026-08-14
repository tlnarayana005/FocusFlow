/**
 * ─────────────────────────────────────────────
 *  controllers/userController.js — Profile
 * ─────────────────────────────────────────────
 *  Handles:
 *  - getProfile:    Get the logged-in user's info
 *  - updateProfile: Update name, goalHours, etc.
 *
 *  NOTE: req.user is set by the auth middleware,
 *        so we always know WHO is making the request.
 */

const User = require('../models/User');

// ─── GET PROFILE ───────────────────────────────────────────
// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    // req.user was set by the auth middleware
    // Find the full user document (excluding password)
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE PROFILE ────────────────────────────────────────
// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only the fields that were sent in the request body
    // If a field is not sent, it keeps its old value
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.goalHours = req.body.goalHours ?? user.goalHours;       // ?? allows 0
    user.focusScore = req.body.focusScore ?? user.focusScore;
    user.screenTime = req.body.screenTime ?? user.screenTime;
    user.streak = req.body.streak ?? user.streak;

    // Save the updated user to the database
    const updatedUser = await user.save();

    // Send back the updated user (without password)
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      goalHours: updatedUser.goalHours,
      focusScore: updatedUser.focusScore,
      screenTime: updatedUser.screenTime,
      streak: updatedUser.streak,
      joinDate: updatedUser.joinDate,
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile };
