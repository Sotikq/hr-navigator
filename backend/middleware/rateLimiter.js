const rateLimit = require('express-rate-limit');

/**
 * Creates a rate limiter middleware with configurable options
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Custom error message
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per windowMs
    message: {
      status: 'error',
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
  });
};

// Create default rate limiter instance
const defaultLimiter = createRateLimiter();

module.exports = {
  createRateLimiter,
  defaultLimiter
}; 