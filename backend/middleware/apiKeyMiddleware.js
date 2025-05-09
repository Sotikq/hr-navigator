const logger = require('../utils/logger');

/**
 * Middleware to validate API key from header or query parameter
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether the API key is required (default: true)
 * @returns {Function} Express middleware
 */
const validateApiKey = (options = { required: true }) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.key;
    const expectedKey = process.env.API_KEY;

    // If API key is not required and not provided, allow the request
    if (!options.required && !apiKey) {
      return next();
    }

    // If API key is required but not provided
    if (!apiKey) {
      logger.warn('API key missing from request', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({
        status: 'error',
        message: 'API key is required'
      });
    }

    // If API key is invalid
    if (apiKey !== expectedKey) {
      logger.warn('Invalid API key provided', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key'
      });
    }

    // API key is valid
    next();
  };
};

module.exports = validateApiKey; 