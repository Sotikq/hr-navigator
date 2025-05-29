const Payment = require('../models/Payment');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// Создать заявку (user)
async function createPaymentRequest(req, res, next) {
  try {
    const { course_id, phone } = req.body;
    const user_id = req.user.id;
    if (!course_id || !phone) throw ApiError.badRequest('Course ID and phone required');
    const payment = await Payment.createPaymentRequest({ user_id, course_id, phone });
    logger.info('Payment request created', { paymentId: payment.id, userId: user_id, courseId: course_id });
    res.status(201).json(payment);
  } catch (e) {
    logger.error('Error creating payment request:', e);
    next(e);
  }
}

// Получить все заявки (admin)
async function getAllPayments(req, res, next) {
  try {
    const payments = await Payment.getAllPayments();
    res.json(payments);
  } catch (e) {
    logger.error('Error fetching payments:', e);
    next(e);
  }
}

// Выставить счет (admin)
async function invoicePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { invoice_url } = req.body;
    await Payment.invoicePayment(id, invoice_url);
    res.json({ success: true });
  } catch (e) {
    logger.error('Error invoicing payment:', e);
    next(e);
  }
}

// Подтвердить оплату (admin)
async function confirmPayment(req, res, next) {
  try {
    const { id } = req.params;
    await Payment.confirmPayment(id);
    res.json({ success: true });
  } catch (e) {
    logger.error('Error confirming payment:', e);
    next(e);
  }
}

// Отклонить заявку (admin)
async function rejectPayment(req, res, next) {
  try {
    const { id } = req.params;
    await Payment.rejectPayment(id);
    res.json({ success: true });
  } catch (e) {
    logger.error('Error rejecting payment:', e);
    next(e);
  }
}

// Проверить доступ пользователя к курсу
async function checkCourseAccessHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;
    const hasAccess = await Payment.checkCourseAccess(userId, courseId);
    res.json({ hasAccess });
  } catch (e) {
    logger.error('Error checking course access:', e);
    next(e);
  }
}

// Получить информацию о платеже по ID
async function getPaymentHandler(req, res, next) {
  try {
    const paymentId = req.params.id;
    const userId = req.user.id;
    const payment = await Payment.getPaymentById(paymentId, userId);
    res.json(payment);
  } catch (e) {
    logger.error('Error getting payment:', e);
    next(e);
  }
}

// Получить все свои заявки
async function getMyPayments(req, res, next) {
  try {
    const user_id = req.user.id;
    const payments = await Payment.getPaymentsByUser(user_id);
    res.json(payments);
  } catch (e) {
    logger.error('Error fetching user payments:', e);
    next(e);
  }
}

// Удалить свою заявку
async function deletePayment(req, res, next) {
  try {
    const user_id = req.user.id;
    const payment_id = req.params.id;
    await Payment.deletePayment(payment_id, user_id);
    res.json({ success: true });
  } catch (e) {
    logger.error('Error deleting payment:', e);
    next(e);
  }
}

// Повторить заявку на оплату
async function retryPayment(req, res, next) {
  try {
    const { course_id, phone } = req.body;
    const user_id = req.user.id;
    if (!course_id || !phone) throw ApiError.badRequest('Course ID and phone required');
    const payment = await Payment.retryPayment({ user_id, course_id, phone });
    res.status(201).json(payment);
  } catch (e) {
    logger.error('Error retrying payment:', e);
    next(e);
  }
}

// Получить все заявки (админ, с фильтрацией)
async function getAllPaymentsAdmin(req, res, next) {
  try {
    const { status, user_id, course_id } = req.query;
    const payments = await Payment.getAllPaymentsAdmin({ status, user_id, course_id });
    res.json(payments);
  } catch (e) {
    logger.error('Error fetching all payments (admin):', e);
    next(e);
  }
}

module.exports = {
  createPaymentRequest,
  getAllPayments,
  invoicePayment,
  confirmPayment,
  rejectPayment,
  checkCourseAccessHandler,
  getPaymentHandler,
  getMyPayments,
  deletePayment,
  retryPayment,
  getAllPaymentsAdmin
}; 