const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to validate API key from header or query parameter
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether the API key is required (default: true)
 * @returns {Function} Express middleware
 */
const validateApiKey = (options = { required: true }) => {
  return (req, res, next) => {
    logger.info('validateApiKey: start', { path: req.path, method: req.method });
    try {
      // Get API key from headers (case-insensitive) or query
      const apiKey = req.headers['x-api-key'] || 
                    req.headers['X-API-Key'] || 
                    req.query.key;
      
      const expectedKey = process.env.API_KEY;

      // Validate environment variable
      if (!expectedKey) {
        logger.error('validateApiKey: API_KEY environment variable not set', {
          path: req.path,
          method: req.method
        });
        throw new ApiError(500, 'Server configuration error');
      }

      // If API key is not required and not provided, allow the request
      if (!options.required && !apiKey) {
        logger.info('validateApiKey: API key not required and not provided, calling next()', { apiKey });
        return next();
      }

      // If API key is required but not provided
      if (!apiKey) {
        logger.warn('validateApiKey: missing API key', { 
          path: req.path,
          method: req.method,
          headers: Object.keys(req.headers)
        });
        throw new ApiError(401, 'API key is required');
      }

      // If API key is invalid
      if (apiKey !== expectedKey) {
        logger.warn('validateApiKey: invalid API key', { 
          path: req.path,
          method: req.method,
          providedKeyPrefix: apiKey.substring(0, 4) + '...',
          expectedKeyPrefix: expectedKey.substring(0, 4) + '...'
        });
        throw new ApiError(401, 'Invalid API key');
      }

      // API key is valid
      logger.info('validateApiKey: key valid, calling next()', { apiKey });
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validateApiKey; 