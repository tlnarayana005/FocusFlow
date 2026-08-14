/**
 * ─────────────────────────────────────────────
 *  routes/sessionRoutes.js — Session Routes
 * ─────────────────────────────────────────────
 *  GET    /api/sessions       → Get all my sessions
 *  GET    /api/sessions/today → Get today's sessions
 *  POST   /api/sessions       → Create a new session
 *  PUT    /api/sessions/:id   → Update a session
 *  DELETE /api/sessions/:id   → Delete a session
 *
 *  All routes are PROTECTED — token required.
 */

const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const {
  getSessions,
  getTodaySessions,
  createSession,
  updateSession,
  deleteSession,
} = require('../controllers/sessionController');

// IMPORTANT: Put /today BEFORE /:id
// Otherwise Express thinks "today" is an ID!
router.get('/today', protect, getTodaySessions);

router.get('/', protect, getSessions);
router.post('/', protect, createSession);
router.put('/:id', protect, updateSession);
router.delete('/:id', protect, deleteSession);

module.exports = router;
