/**
 * ─────────────────────────────────────────────
 *  routes/settingsRoutes.js — Settings Routes
 * ─────────────────────────────────────────────
 *  GET /api/settings → Get my settings
 *  PUT /api/settings → Update my settings
 *
 *  All routes are PROTECTED — token required.
 */

const express = require('express');
const router = express.Router();

const protect = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);

module.exports = router;
