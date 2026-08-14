/**
 * ─────────────────────────────────────────────
 *  controllers/authController.js — Register & Login
 * ─────────────────────────────────────────────
 *  Contains the logic for:
 *  - registerUser: Create a new account
 *  - loginUser:    Log in to an existing account
 *
 *  Both return a JWT token on success.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Settings = require('../models/Settings');

// ─── Helper: Generate a JWT token ──────────────────────────
// We put the user's ID inside the token so we can identify them later
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // Payload — data stored in the token
    process.env.JWT_SECRET,   // Secret key — used to sign the token
    { expiresIn: '30d' }      // Token expires in 30 days
  );
};

// ─── REGISTER ──────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account
const registerUser = async (req, res) => {
  try {
    // Step 1: Get data from request body
    const { name, email, password } = req.body;

    // Step 2: Validate — make sure all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Step 3: Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Step 4: Hash the password (never store plain text passwords!)
    // "salt" adds randomness to the hash — 10 is the number of rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Step 5: Create the user in the database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Step 6: Create default settings for this new user
    await Settings.create({ user: user._id });

    // Step 7: Send back the user info + token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─── LOGIN ─────────────────────────────────────────────────
// POST /api/auth/login
// Logs in an existing user
const loginUser = async (req, res) => {
  try {
    // Step 1: Get email and password from request body
    const { email, password } = req.body;

    // Step 2: Validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Step 3: Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Step 4: Compare the provided password with the hashed password
    // bcrypt.compare() hashes the provided password and compares
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Step 5: Send back user info + token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { registerUser, loginUser };
