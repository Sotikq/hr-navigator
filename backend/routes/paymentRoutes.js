const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const {
  createPaymentHandler,
  getPaymentHandler,
  confirmPaymentHandler,
  checkCourseAccessHandler,
  getPendingPaymentsHandler
} = require('../controllers/paymentController');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */

/**
 * @swagger
 * /payments/pending:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payments pending confirmation (admin only)
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of pending payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   user_id:
 *                     type: string
 *                   user_email:
 *                     type: string
 *                   user_name:
 *                     type: string
 *                   course_id:
 *                     type: string
 *                   course_title:
 *                     type: string
 *                   course_price:
 *                     type: number
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   payment_expires_at:
 *                     type: string
 *                     format: date-time
 *       403:
 *         description: Only admins can access this endpoint
 */
router.get('/pending',
  authMiddleware,
  validateApiKey(),
  checkRole(['admin']),
  getPendingPaymentsHandler
);

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

module.exports = router;