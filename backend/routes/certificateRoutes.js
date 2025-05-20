const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');

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

module.exports = router; 