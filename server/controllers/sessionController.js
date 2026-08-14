/**
 * ─────────────────────────────────────────────
 *  controllers/sessionController.js — Session CRUD
 * ─────────────────────────────────────────────
 *  Handles all focus/break session operations:
 *  - getSessions:    Get all sessions (with optional date filter)
 *  - getTodaySessions: Get only today's sessions
 *  - createSession:  Start a new focus/break session
 *  - updateSession:  Update a session (e.g., mark as completed)
 *  - deleteSession:  Delete a session
 */

const Session = require('../models/Session');

// ─── GET ALL SESSIONS ──────────────────────────────────────
// GET /api/sessions
// Optional query params: ?startDate=2024-01-01&endDate=2024-01-31
const getSessions = async (req, res) => {
  try {
    // Build a filter object — always filter by the logged-in user
    const filter = { user: req.user._id };

    // If date range is provided, add it to the filter
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);  // Greater than or equal
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);    // Less than or equal
      }
    }

    // Find sessions, sorted by date (newest first)
    const sessions = await Session.find(filter).sort({ date: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET TODAY'S SESSIONS ──────────────────────────────────
// GET /api/sessions/today
const getTodaySessions = async (req, res) => {
  try {
    // Get the start and end of today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sessions = await Session.find({
      user: req.user._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ date: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Get today sessions error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── CREATE SESSION ────────────────────────────────────────
// POST /api/sessions
const createSession = async (req, res) => {
  try {
    const { duration, type, category, completed, date } = req.body;

    // Create a new session linked to the logged-in user
    const session = await Session.create({
      user: req.user._id,
      duration: duration || 25,
      type: type || 'focus',
      category: category || 'work',
      completed: completed || false,
      date: date || new Date(),
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE SESSION ────────────────────────────────────────
// PUT /api/sessions/:id
const updateSession = async (req, res) => {
  try {
    // Find the session by ID
    const session = await Session.findById(req.params.id);

    // Check if session exists
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Make sure the session belongs to the logged-in user
    // .toString() is needed because _id is an ObjectId, not a string
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this session' });
    }

    // Update the session with new data
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }    // "new: true" returns the updated document
    );

    res.json(updatedSession);
  } catch (error) {
    console.error('Update session error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE SESSION ────────────────────────────────────────
// DELETE /api/sessions/:id
const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Make sure the session belongs to the logged-in user
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this session' });
    }

    await Session.findByIdAndDelete(req.params.id);

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSessions,
  getTodaySessions,
  createSession,
  updateSession,
  deleteSession,
};
