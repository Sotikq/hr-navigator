const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const {
  createPaymentHandler,
  getPaymentHandler,
  confirmPaymentHandler,
  checkCourseAccessHandler
} = require('../controllers/paymentController');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create a new payment
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *             properties:
 *               course_id:
 *                 type: string
 *                 description: ID of the course to purchase
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 course_id:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                 qr_code_url:
 *                   type: string
 *                 payment_expires_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request or payment amount mismatch
 *       404:
 *         description: Course not found
 */
router.post('/',
  authMiddleware,
  validateApiKey(),
  createPaymentHandler
);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 course_id:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                 qr_code_url:
 *                   type: string
 *                 payment_expires_at:
 *                   type: string
 *                   format: date-time
 *                 confirmed_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Payment not found or access denied
 *       400:
 *         description: Payment has expired
 */
router.get('/:id',
  authMiddleware,
  validateApiKey(),
  getPaymentHandler
);

/**
 * @swagger
 * /payments/{id}/confirm:
 *   patch:
 *     tags: [Payments]
 *     summary: Confirm payment (admin only)
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 confirmed_at:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Only admins can confirm payments
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Payment already confirmed or has expired
 */
router.patch('/:id/confirm',
  authMiddleware,
  validateApiKey(),
  checkRole(['admin']),
  confirmPaymentHandler
);

/**
 * @swagger
 * /courses/{id}/access:
 *   get:
 *     tags: [Courses]
 *     summary: Check if user has access to course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/courses/:id/access',
  authMiddleware,
  validateApiKey(),
  checkCourseAccessHandler
);

module.exports = router;