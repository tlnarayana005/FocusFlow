/**
 * ─────────────────────────────────────────────
 *  middleware/auth.js — JWT Auth Middleware
 * ─────────────────────────────────────────────
 *  This middleware runs BEFORE a route handler.
 *  It checks if the request has a valid JWT token.
 *
 *  HOW IT WORKS:
 *  1. Client sends: Authorization: Bearer <token>
 *  2. We extract the token from the header
 *  3. We verify it using our JWT_SECRET
 *  4. If valid → attach the user's ID to req.user
 *  5. If invalid → send 401 Unauthorized
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Step 1: Check if the Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Step 2: Extract the token (split "Bearer <token>" and take the second part)
      token = req.headers.authorization.split(' ')[1];

      // Step 3: Verify the token using our secret key
      // If the token is invalid or expired, this will throw an error
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Step 4: Find the user in the database and attach to request
      // .select('-password') means "get everything EXCEPT the password"
      req.user = await User.findById(decoded.id).select('-password');

      // Step 5: Move on to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      res.status(401).json({ message: 'Not authorized — invalid token' });
    }
  }

  // If no token was found at all
  if (!token) {
    res.status(401).json({ message: 'Not authorized — no token provided' });
  }
};

module.exports = protect;
