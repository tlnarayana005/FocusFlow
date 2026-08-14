/**
 * ─────────────────────────────────────────────
 *  routes/userRoutes.js — User Profile Routes
 * ─────────────────────────────────────────────
 *  GET  /api/users/profile → Get my profile
 *  PUT  /api/users/profile → Update my profile
 *
 *  These routes are PROTECTED — token required.
 */

const express = require('express');
const router = express.Router();

// Import middleware and controller
const protect = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');

// "protect" runs first → then the controller
// This ensures only logged-in users can access these routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
