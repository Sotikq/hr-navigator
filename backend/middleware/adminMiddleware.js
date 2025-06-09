const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has admin role
 * @returns {Function} Express middleware
 */
const adminMiddleware = (req, res, next) => {
  logger.info('adminMiddleware: checking admin access', { 
    path: req.path, 
    method: req.method, 
    userRole: req.user?.role 
  });

  // Ensure authMiddleware was called first
  if (!req.user || !req.user.role) {
    logger.warn('adminMiddleware: no user/role found');
    return next(ApiError.unauthorized('Authentication required'));
  }

  // Check if user's role is admin
  if (req.user.role !== 'admin') {
    logger.warn('adminMiddleware: insufficient permissions', { 
      userId: req.user.id, 
      userRole: req.user.role,
      path: req.path 
    });
    return next(ApiError.forbidden('Admin access required'));
  }

  // User is admin, proceed
  logger.info('adminMiddleware: admin access granted', { 
    userId: req.user.id, 
    path: req.path 
  });
  next();
};

module.exports = adminMiddleware; 