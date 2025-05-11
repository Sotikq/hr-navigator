const errorHandler = require('./errorHandler');
const authMiddleware = require('./authMiddleware');
const { defaultLimiter, createRateLimiter } = require('./rateLimiter');
const validateApiKey = require('./apiKeyMiddleware');
const checkRole = require('./roleMiddleware');

// Export all middlewares
module.exports = {
  errorHandler,
  authMiddleware,
  defaultLimiter,
  createRateLimiter,
  validateApiKey,
  checkRole,
  // Add other middlewares here as they are created
}; 