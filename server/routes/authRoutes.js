/**
 * ─────────────────────────────────────────────
 *  routes/authRoutes.js — Auth Routes
 * ─────────────────────────────────────────────
 *  POST /api/auth/register → Create an account
 *  POST /api/auth/login    → Log in
 *
 *  These routes are PUBLIC — no token needed.
 */

const express = require('express');
const router = express.Router();

// Import the controller functions
const { registerUser, loginUser } = require('../controllers/authController');

// Define routes
// When someone sends POST to /api/auth/register, run registerUser
router.post('/register', registerUser);

// When someone sends POST to /api/auth/login, run loginUser
router.post('/login', loginUser);

module.exports = router;
