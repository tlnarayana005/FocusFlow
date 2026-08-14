/**
 * ═══════════════════════════════════════════════════════════
 *  server.js — FocusFlow Backend Entry Point
 * ═══════════════════════════════════════════════════════════
 *  This is the MAIN file that starts everything:
 *  1. Loads environment variables from .env
 *  2. Connects to MongoDB
 *  3. Sets up Express middleware (CORS, JSON parsing)
 *  4. Registers all API routes
 *  5. Starts the server
 *
 *  To run:  npm start       (or)  npm run dev
 *  To test: Visit http://localhost:5000/api in your browser
 * ═══════════════════════════════════════════════════════════
 */

// ─── Step 1: Load environment variables ────────────────────
// dotenv reads the .env file and puts values into process.env
const dotenv = require('dotenv');
dotenv.config();

// ─── Step 2: Import dependencies ───────────────────────────
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// ─── Step 3: Import route files ────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// ─── Step 4: Create the Express app ───────────────────────
const app = express();

// ─── Step 5: Middleware ────────────────────────────────────
// cors() allows the frontend (running on a different port) to talk to this server
app.use(cors());

// express.json() parses incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// ─── Step 6: Register Routes ──────────────────────────────
// All auth routes will start with /api/auth
app.use('/api/auth', authRoutes);

// All user routes will start with /api/users
app.use('/api/users', userRoutes);

// All session routes will start with /api/sessions
app.use('/api/sessions', sessionRoutes);

// All settings routes will start with /api/settings
app.use('/api/settings', settingsRoutes);

// ─── Step 7: Root route (just for testing) ────────────────
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 FocusFlow API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/register, /api/auth/login',
      users: '/api/users/profile',
      sessions: '/api/sessions',
      settings: '/api/settings',
    },
  });
});

// ─── Step 8: Connect to MongoDB and start the server ──────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`🚀 FocusFlow Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log('═══════════════════════════════════════════');
    console.log('');
  });
});
