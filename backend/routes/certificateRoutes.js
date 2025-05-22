const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
const rateLimit = require('express-rate-limit');
const mcache = require('memory-cache');

// Rate limiting middleware
const validateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests, please try again later'
  }
});

// Cache middleware
const cache = (duration) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = mcache.get(key);
    
    if (cachedBody) {
      res.json(cachedBody);
      return;
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      mcache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

/**
 * @swagger
 * tags:
 *   - name: Certificates
 *     description: Certificate generation and management
 */

/**
 * @swagger
 * /certificates/generate/{courseId}:
 *   post:
 *     summary: Generate a certificate for a completed course
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the course
 *     responses:
 *       201:
 *         description: Certificate generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 certificate_number:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 course_id:
 *                   type: string
 *                 hours:
 *                   type: integer
 *                 issued_at:
 *                   type: string
 *                   format: date-time
 *                 file_path:
 *                   type: string
 *                 qr_code_url:
 *                   type: string
 *                 is_valid:
 *                   type: boolean
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/generate/:courseId', authMiddleware, apiKeyMiddleware, certificateController.generateCertificate);

/**
 * @swagger
 * /certificates/verify/{certificateNumber}:
 *   get:
 *     summary: Verify a certificate by its number
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: The certificate number to verify
 *     responses:
 *       200:
 *         description: Certificate verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [valid, revoked, error]
 *                 message:
 *                   type: string
 *                 certificate:
 *                   type: object
 *                   properties:
 *                     certificateNumber:
 *                       type: string
 *                     userName:
 *                       type: string
 *                     courseTitle:
 *                       type: string
 *                     issuedAt:
 *                       type: string
 *                     version:
 *                       type: integer
 *                 details:
 *                   type: object
 *                   properties:
 *                     revokedAt:
 *                       type: string
 *                     revocationReason:
 *                       type: string
 */
router.get('/verify/:certificateNumber', 
  validateLimiter,
  cache(3600), // Cache for 1 hour
  certificateController.validateCertificate
);

module.exports = router; 