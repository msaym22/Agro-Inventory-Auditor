// backend/middleware/auth.js

/**
 * Dummy middleware to bypass authentication.
 * It does nothing but call next() to proceed to the next handler.
 */
const protect = (req, res, next) => {
  // This middleware is currently set to bypass login.
  // The request will proceed without any user authentication.
  next();
};

// Export the dummy 'protect' function correctly.
// This is the part that fixes the server crash.
module.exports = {
  protect,
};