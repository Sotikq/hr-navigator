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

module.exports = { generateCertificate }; 