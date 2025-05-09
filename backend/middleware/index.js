const errorHandler = require('./errorHandler');
const authMiddleware = require('./authMiddleware');
const { defaultLimiter, createRateLimiter } = require('./rateLimiter');
const validateApiKey = require('./apiKeyMiddleware');

// Export all middlewares
module.exports = {
  errorHandler,
  authMiddleware,
  defaultLimiter,
  createRateLimiter,
  validateApiKey,
  // Add other middlewares here as they are created
}; 