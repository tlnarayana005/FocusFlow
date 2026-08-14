/**
 * ─────────────────────────────────────────────
 *  config/db.js — MongoDB Connection Helper
 * ─────────────────────────────────────────────
 *  This file exports a single function that
 *  connects our Express app to MongoDB using
 *  the Mongoose library.
 *
 *  HOW IT WORKS:
 *  1. We read the MONGO_URI from the .env file
 *  2. We call mongoose.connect() with that URI
 *  3. If it works → log success
 *  4. If it fails → log error and stop the app
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise
    // We "await" it so we know when it's done
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit the app with failure code (1)
    process.exit(1);
  }
};

// Export the function so server.js can use it
module.exports = connectDB;
