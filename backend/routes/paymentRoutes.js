const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const {
  createPaymentRequest,
  getAllPayments,
  invoicePayment,
  confirmPayment,
  rejectPayment,
  getPaymentHandler,
  getMyPayments,
  deletePayment,
  retryPayment,
  getAllPaymentsAdmin
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
  checkRole(['admin']),
  getAllPayments
);

/**
 * @swagger
 * /payments/my:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payment requests of the current user
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of user's payment requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
router.get('/my', authMiddleware, getMyPayments);

/**
 * @swagger
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create a new payment request
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
 *               - phone
 *             properties:
 *               course_id:
 *                 type: string
 *                 description: ID of the course to purchase
 *               phone:
 *                 type: string
 *                 description: User's phone number for payment
 *     responses:
 *       201:
 *         description: Payment request created successfully
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
 *                   enum: [pending, invoiced, confirmed, rejected]
 *                 qr_code_url:
 *                   type: string
 *                 payment_expires_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request or missing required fields
 *       404:
 *         description: Course not found
 */
router.post('/', authMiddleware, createPaymentRequest);

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
router.get('/:id', authMiddleware, getPaymentHandler);

/**
 * @swagger
 * /payments/{id}/invoice:
 *   patch:
 *     tags: [Payments]
 *     summary: Invoice payment (admin only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoice_url
 *             properties:
 *               invoice_url:
 *                 type: string
 *                 description: URL to the generated invoice
 *     responses:
 *       200:
 *         description: Payment invoiced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [invoiced]
 *                 invoiced_at:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Only admins can invoice payments
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Payment already invoiced or has expired
 */
router.patch('/:id/invoice', authMiddleware, checkRole(['admin']), invoicePayment);

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
 *                   enum: [confirmed]
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
router.patch('/:id/confirm', authMiddleware, checkRole(['admin']), confirmPayment);

/**
 * @swagger
 * /payments/{id}/reject:
 *   patch:
 *     tags: [Payments]
 *     summary: Reject payment (admin only)
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
 *         description: Payment rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [rejected]
 *                 rejected_at:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Only admins can reject payments
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Payment already rejected or has expired
 */
router.patch('/:id/reject', authMiddleware, checkRole(['admin']), rejectPayment);

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     tags: [Payments]
 *     summary: Delete your own payment request (if pending)
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
 *         description: Payment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400: 
 *          description:Cannot delete: not found or already processed
 */
router.delete('/:id', authMiddleware, deletePayment);

/**
 * @swagger
 * /payments/retry:
 *   post:
 *     tags: [Payments]
 *     summary: Retry payment request for a course (if previous expired or rejected)
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
 *               - phone
 *             properties:
 *               course_id:
 *                 type: string
 *                 description: Course ID
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *     responses:
 *       201:
 *         description: New payment request created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Too many requests or already has active payment
 */
router.post('/retry', authMiddleware, retryPayment);

/**
 * @swagger
 * /payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payment requests (admin only, with filters)
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by payment status
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *     responses:
 *       200:
 *         description: List of all payment requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       403:
 *         description: Only admins can access this endpoint
 */
router.get('/', authMiddleware, checkRole(['admin']), getAllPaymentsAdmin);

module.exports = router;