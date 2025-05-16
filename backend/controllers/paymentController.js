const Payment = require('../models/Payment');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Create a new payment
 * @route POST /api/payments
 */
async function createPaymentHandler(req, res, next) {
  try {
    const { course_id } = req.body;
    const user_id = req.user.id;

    if (!course_id) {
      throw ApiError.badRequest('Course ID is required');
    }

    const payment = await Payment.createPayment({
      user_id,
      course_id
    });

    logger.info('Payment created successfully', { 
      paymentId: payment.id,
      userId: user_id,
      courseId: course_id,
      amount: payment.amount,
      courseTitle: payment.course_title
    });

    res.status(201).json(payment);
  } catch (error) {
    logger.error('Error creating payment:', error);
    next(error);
  }
}

/**
 * Get payment by ID
 * @route GET /api/payments/:id
 */
async function getPaymentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const payment = await Payment.getPaymentById(id, user_id);
    
    logger.info('Payment retrieved successfully', { 
      paymentId: id,
      userId: user_id,
      courseTitle: payment.course_title
    });

    res.json(payment);
  } catch (error) {
    logger.error('Error fetching payment:', error);
    next(error);
  }
}

/**
 * Confirm payment (admin only)
 * @route PATCH /api/payments/:id/confirm
 */
async function confirmPaymentHandler(req, res, next) {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin') {
      logger.warn('Non-admin attempt to confirm payment', { 
        paymentId: id,
        userId: req.user.id
      });
      throw ApiError.forbidden('Only admins can confirm payments');
    }

    const payment = await Payment.confirmPayment(id);
    
    logger.info('Payment confirmed successfully', { 
      paymentId: id,
      confirmedBy: req.user.id,
      courseTitle: payment.course_title
    });

    res.json(payment);
  } catch (error) {
    logger.error('Error confirming payment:', error);
    next(error);
  }
}

/**
 * Check course access
 * @route GET /api/courses/:id/access
 */
async function checkCourseAccessHandler(req, res, next) {
  try {
    const { id: course_id } = req.params;
    const user_id = req.user.id;

    const hasAccess = await Payment.checkCourseAccess(user_id, course_id);
    
    logger.info('Course access check completed', {
      userId: user_id,
      courseId: course_id,
      hasAccess
    });

    res.json({ hasAccess });
  } catch (error) {
    logger.error('Error checking course access:', error);
    next(error);
  }
}

module.exports = {
  createPaymentHandler,
  getPaymentHandler,
  confirmPaymentHandler,
  checkCourseAccessHandler
}; 