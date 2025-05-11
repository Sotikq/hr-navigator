const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has required role(s)
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure authMiddleware was called first
    if (!req.user || !req.user.role) {
      logger.warn('Role check failed: User not authenticated', {
        path: req.path,
        method: req.method
      });
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Role check failed: Insufficient permissions', {
        path: req.path,
        method: req.method,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      return next(ApiError.forbidden('Insufficient permissions to access this resource'));
    }

    // User has required role, proceed
    next();
  };
};

module.exports = checkRole; 