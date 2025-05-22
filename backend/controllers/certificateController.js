const certificateService = require('../certificateService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

async function generateCertificate(req, res, next) {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    logger.info(`API: Generating certificate for user ${userId}, course ${courseId}`);
    const cert = await certificateService.generateCertificate(userId, courseId);
    res.status(201).json(cert);
  } catch (err) {
    logger.error('Certificate generation failed', { error: err.message });
    if (err.message === 'Course not completed') {
      return next(ApiError.badRequest('Course not completed'));
    }
    if (err.message === 'User or course not found') {
      return next(ApiError.notFound('User or course not found'));
    }
    next(ApiError.internal(err.message));
  }
}

async function validateCertificate(req, res, next) {
  try {
    const { certificateNumber } = req.params;
    const ip = req.ip;
    
    logger.info('Certificate validation request', { 
      certificateNumber,
      ip,
      userAgent: req.headers['user-agent']
    });

    const result = await certificateService.validateCertificate(certificateNumber);
    
    logger.info('Certificate validation result', { 
      certificateNumber,
      status: result.status
    });

    res.json(result);
  } catch (err) {
    logger.error('Certificate validation failed', { 
      error: err.message,
      certificateNumber: req.params.certificateNumber
    });
    next(ApiError.internal(err.message));
  }
}

module.exports = { 
  generateCertificate,
  validateCertificate
}; 