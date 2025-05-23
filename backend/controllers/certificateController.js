const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const certificateService = require('../certificateService');
const pool = require('../config/db');

// Generate certificate for a course
const generateCertificate = async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  try {
    const certificate = await certificateService.generateCertificate(userId, courseId);
    res.status(201).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    logger.error('Certificate generation failed', { error: error.message, userId, courseId });
    next(new ApiError(error.message, 400));
  }
};

// Get all certificates for current user
const getUserCertificates = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const { rows: certificates } = await pool.query(
      'SELECT * FROM certificates WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    logger.error('Failed to fetch user certificates', { error: error.message, userId });
    next(new ApiError('Failed to fetch certificates', 500));
  }
};

// View certificate file (PDF/JPG)
const viewCertificate = async (req, res, next) => {
  const { id, format } = req.params;
  const userId = req.user.id;

  // Validate format
  if (!['pdf', 'jpg'].includes(format)) {
    return next(new ApiError('Invalid format. Supported formats: pdf, jpg', 400));
  }

  try {
    // Verify certificate ownership
    const { rows: [certificate] } = await pool.query(
      'SELECT * FROM certificates WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL',
      [id, userId]
    );

    if (!certificate) {
      throw new ApiError('Certificate not found', 404);
    }

    let filePath;
    if (format === 'pdf') {
      filePath = path.join(__dirname, '..', certificate.file_path.replace('.jpg', '.pdf'));
    } else {
      filePath = path.join(__dirname, '..', certificate.file_path);
    }

    if (!fsSync.existsSync(filePath)) {
      return next(ApiError.notFound(`Certificate file not found: ${format}`));
    }

    // Set appropriate headers
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="certificate.${format}"`);
    
    // Stream the file
    res.sendFile(filePath);
  } catch (error) {
    logger.error('Failed to view certificate', { error: error.message, userId, certificateId: id });
    next(error);
  }
};

// Download certificate file (PDF/JPG)
const downloadCertificate = async (req, res, next) => {
  const { id, format } = req.params;
  const userId = req.user.id;

  // Validate format
  if (!['pdf', 'jpg'].includes(format)) {
    return next(new ApiError('Invalid format. Supported formats: pdf, jpg', 400));
  }

  try {
    // Verify certificate ownership
    const { rows: [certificate] } = await pool.query(
      'SELECT * FROM certificates WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL',
      [id, userId]
    );

    if (!certificate) {
      throw new ApiError('Certificate not found', 404);
    }

    let filePath;
    if (format === 'pdf') {
      filePath = path.join(__dirname, '..', certificate.file_path.replace('.jpg', '.pdf'));
    } else {
      filePath = path.join(__dirname, '..', certificate.file_path);
    }

    if (!fsSync.existsSync(filePath)) {
      return next(ApiError.notFound(`Certificate file not found: ${format}`));
    }

    // Set appropriate headers for download
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="certificate.${format}"`);
    
    // Stream the file
    res.sendFile(filePath);
  } catch (error) {
    logger.error('Failed to download certificate', { error: error.message, userId, certificateId: id });
    next(error);
  }
};

module.exports = {
  generateCertificate,
  getUserCertificates,
  viewCertificate,
  downloadCertificate
}; 