const logger = require('../utils/logger');

/**
 * Middleware to validate API key from header or query parameter
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether the API key is required (default: true)
 * @returns {Function} Express middleware
 */
const validateApiKey = (options = { required: true }) => {
  return (req, res, next) => {
    logger.info('validateApiKey: start', { path: req.path, method: req.method });
    const apiKey = req.headers['x-api-key'] || req.query.key;
    const expectedKey = process.env.API_KEY;

    // If API key is not required and not provided, allow the request
    if (!options.required && !apiKey) {
      logger.info('validateApiKey: not required and not provided, calling next()', { path: req.path });
      return next();
    }

    // If API key is required but not provided
    if (!apiKey) {
      logger.info('validateApiKey: missing, sending 401', { path: req.path });
      return res.status(401).json({
        status: 'error',
        message: 'API key is required'
      });
    }

    // If API key is invalid
    if (apiKey !== expectedKey) {
      logger.info('validateApiKey: invalid, sending 401', { path: req.path });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key'
      });
    }

    // API key is valid
    logger.info('validateApiKey: valid, calling next()', { path: req.path });
    next();
  };
};

module.exports = validateApiKey; 