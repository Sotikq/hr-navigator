const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let isOperational = err instanceof ApiError;

  // Log the error with appropriate level
  const errorLog = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    isOperational,
    timestamp: new Date().toISOString()
  };

  if (isOperational) {
    // For known operational errors, log as warning
    logger.warn('Operational error occurred', errorLog);
  } else {
    // For unknown errors, log as error with full stack trace
    logger.error('Unexpected error occurred', errorLog);
  }

  // Send response based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production, don't expose stack traces
    return res.status(statusCode).json({
      status: 'error',
      message: isOperational ? message : 'Internal server error'
    });
  } else {
    // In development, include more details
    return res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
      isOperational
    });
  }
};

module.exports = errorHandler; 