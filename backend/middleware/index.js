const errorHandler = require('./errorHandler');
const authMiddleware = require('./authMiddleware');

// Export all middlewares
module.exports = {
  errorHandler,
  authMiddleware,
  // Add other middlewares here as they are created
}; 