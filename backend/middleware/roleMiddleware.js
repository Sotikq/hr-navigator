const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has required role(s)
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    logger.info('checkRole: start', { path: req.path, method: req.method, allowedRoles });
    // Ensure authMiddleware was called first
    if (!req.user || !req.user.role) {
      logger.info('checkRole: no user/role, calling next(ApiError.unauthorized)', { path: req.path });
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      logger.info('checkRole: insufficient permissions, calling next(ApiError.forbidden)', { path: req.path, userRole: req.user.role });
      return next(ApiError.forbidden('Insufficient permissions to access this resource'));
    }

    // User has required role, proceed
    logger.info('checkRole: role valid, calling next()', { path: req.path, userRole: req.user.role });
    next();
  };
};

module.exports = checkRole; 