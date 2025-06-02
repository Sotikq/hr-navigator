const pool = require('../config/db');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new payment record
 * @param {Object} paymentData - Payment data
 * @param {string} paymentData.user_id - User ID
 * @param {string} paymentData.course_id - Course ID
 * @returns {Promise<Object>} Created payment record
 */
async function createPayment({ user_id, course_id }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if course exists and get its price
    const courseQuery = 'SELECT id, price, title FROM courses WHERE id = $1';
    const courseResult = await client.query(courseQuery, [course_id]);
    
    if (courseResult.rows.length === 0) {
      throw ApiError.notFound('Course not found');
    }

    const course = courseResult.rows[0];

    // Check if user already has an active payment for this course
    const existingPaymentQuery = `
      SELECT id FROM payments 
      WHERE user_id = $1 AND course_id = $2 AND status = 'confirmed'
    `;
    const existingPayment = await client.query(existingPaymentQuery, [user_id, course_id]);
    
    if (existingPayment.rows.length > 0) {
      logger.info('User already has course access', { userId: user_id, courseId: course_id });
      throw ApiError.badRequest('User already has access to this course');
    }

    // Create payment record
    const paymentQuery = `
      INSERT INTO payments (
        user_id, 
        course_id, 
        amount, 
        currency,
        payment_method,
        status,
        qr_code_url,
        payment_expires_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'KZT', 'Безналичный перевод по выставленному счету на оплату', 'pending', $4, NOW() + INTERVAL '30 minutes', NOW(), NOW())
      RETURNING *
    `;

    const qrCodeUrl = `https://kaspi.kz/qr/fake-payment-${Date.now()}`; // Placeholder QR URL
    const { rows } = await client.query(paymentQuery, [user_id, course_id, course.price, qrCodeUrl]);

    logger.info('Payment created successfully', { 
      paymentId: rows[0].id,
      userId: user_id,
      courseId: course_id,
      amount: course.price,
      courseTitle: course.title
    });

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating payment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get payment by ID
 * @param {string} paymentId - Payment ID
 * @param {string} userId - User ID (for access control)
 * @returns {Promise<Object>} Payment record
 */
async function getPaymentById(paymentId, userId) {
  const query = `
    SELECT p.*, c.title as course_title 
    FROM payments p
    JOIN courses c ON p.course_id = c.id
    WHERE p.id = $1 
    AND (p.user_id = $2 OR EXISTS (
      SELECT 1 FROM users WHERE id = $2 AND role = 'admin'
    ))
    AND (p.status = 'confirmed' OR p.payment_expires_at > NOW())
  `;
  const { rows } = await pool.query(query, [paymentId, userId]);
  
  if (rows.length === 0) {
    logger.warn('Payment not found or access denied', { paymentId, userId });
    throw ApiError.notFound('Payment not found or access denied');
  }

  // Check if payment has expired
  if (rows[0].status === 'pending' && new Date(rows[0].payment_expires_at) < new Date()) {
    logger.info('Payment has expired', { paymentId, userId });
    throw ApiError.badRequest('Payment has expired');
  }
  
  return rows[0];
}

/**
 * Confirm payment (admin only)
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Updated payment record
 */
async function confirmPayment(paymentId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if payment exists and is pending или invoiced
    const checkQuery = `
      SELECT p.id, p.status, p.user_id, p.course_id, p.payment_expires_at, c.title as course_title
      FROM payments p
      JOIN courses c ON p.course_id = c.id
      WHERE p.id = $1 AND p.status IN ('pending', 'invoiced')
    `;
    const checkResult = await client.query(checkQuery, [paymentId]);
    
    if (checkResult.rows.length === 0) {
      throw ApiError.badRequest('Payment not found or already confirmed');
    }

    const payment = checkResult.rows[0];

    // Check if payment has expired
    if (new Date(payment.payment_expires_at) < new Date()) {
      logger.warn('Attempt to confirm expired payment', { paymentId });
      throw ApiError.badRequest('Payment has expired');
    }

    // Update payment status
    const updateQuery = `
      UPDATE payments 
      SET status = 'confirmed', 
          confirmed_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await client.query(updateQuery, [paymentId]);

    // Grant course access
    const grantAccessQuery = `
      INSERT INTO course_access (user_id, course_id, granted_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, course_id) DO NOTHING
    `;
    await client.query(grantAccessQuery, [payment.user_id, payment.course_id]);

    logger.info('Payment confirmed successfully', { 
      paymentId,
      userId: payment.user_id,
      courseId: payment.course_id,
      courseTitle: payment.course_title
    });

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error confirming payment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if user has access to a course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<boolean>} Whether user has access
 */
async function checkCourseAccess(userId, courseId) {
  const query = `
    SELECT 1 
    FROM course_access ca
    JOIN courses c ON ca.course_id = c.id
    WHERE ca.user_id = $1 
    AND ca.course_id = $2
    AND c.is_active = true
  `;
  const { rows } = await pool.query(query, [userId, courseId]);
  
  const hasAccess = rows.length > 0;
  logger.info('Course access check', { 
    userId, 
    courseId, 
    hasAccess 
  });
  
  return hasAccess;
}

/**
 * Get all courses accessible to a user (student)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of courses
 */
async function getAccessibleCourses(userId) {
  const query = `
    SELECT c.*
    FROM course_access ca
    JOIN courses c ON ca.course_id = c.id
    WHERE ca.user_id = $1
    ORDER BY c.created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

/**
 * Get all payments with status 'pending' (for admin confirmation)
 * @returns {Promise<Array>} List of pending payments with user and course info
 */
async function getPendingPayments() {
  const query = `
    SELECT p.*, u.email as user_email, u.name as user_name, c.title as course_title, c.price as course_price
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN courses c ON p.course_id = c.id
    WHERE p.status = 'pending'
    ORDER BY p.created_at ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// Создать заявку на оплату (user)
async function createPaymentRequest({ user_id, course_id, phone }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const courseQuery = 'SELECT id, price, title FROM courses WHERE id = $1';
    const courseResult = await client.query(courseQuery, [course_id]);
    if (courseResult.rows.length === 0) throw ApiError.notFound('Course not found');
    const course = courseResult.rows[0];
    // Проверка на дублирующую заявку
    const existing = await client.query(
      'SELECT id FROM payments WHERE user_id = $1 AND course_id = $2 AND status IN (\'pending\', \'invoiced\', \'paid\')',
      [user_id, course_id]
    );
    if (existing.rows.length > 0) throw ApiError.badRequest('Already requested or paid');
    const paymentId = uuidv4();
    const paymentMethod = 'Безналичный перевод по выставленному счету на оплату';
    const paymentQuery = `
      INSERT INTO payments (id, user_id, course_id, amount, status, phone, payment_method, payment_expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW() + INTERVAL '30 minutes', NOW(), NOW())
      RETURNING *`;
    const { rows } = await client.query(paymentQuery, [paymentId, user_id, course_id, course.price, phone, paymentMethod]);
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Получить все заявки (admin)
async function getAllPayments() {
  const query = `
    SELECT p.*, u.email as user_email, u.name as user_name, c.title as course_title, c.price as course_price
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN courses c ON p.course_id = c.id
    ORDER BY p.created_at DESC`;
  const { rows } = await pool.query(query);
  return rows;
}

// Выставить счет (admin)
async function invoicePayment(id, invoice_url) {
  const { rowCount } = await pool.query(
    `UPDATE payments SET status = 'invoiced', invoice_url = $1, updated_at = NOW() WHERE id = $2 AND status = 'pending'`,
    [invoice_url, id]
  );
  if (!rowCount) throw ApiError.notFound('Not found or already invoiced');
  return true;
}

// Отклонить заявку (admin)
async function rejectPayment(id) {
  const { rowCount } = await pool.query(
    `UPDATE payments SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND status IN ('pending', 'invoiced')`,
    [id]
  );
  if (!rowCount) throw ApiError.notFound('Not found or already processed');
  return true;
}

// Получить все заявки пользователя
async function getPaymentsByUser(user_id) {
  const query = `
    SELECT p.*, c.title as course_title, c.price as course_price
    FROM payments p
    JOIN courses c ON p.course_id = c.id
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
  `;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
}

// Удалить заявку пользователя (только если статус pending)
async function deletePayment(payment_id, user_id) {
  const { rowCount } = await pool.query(
    `DELETE FROM payments WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
    [payment_id, user_id]
  );
  if (!rowCount) throw ApiError.badRequest('Cannot delete: not found or already processed');
  return true;
}

// Повторить заявку на оплату (retry)
async function retryPayment({ user_id, course_id, phone }) {
  // Проверка: есть ли уже подтверждённая заявка (курс куплен)
  const confirmed = await pool.query(
    `SELECT id FROM payments WHERE user_id = $1 AND course_id = $2 AND status = 'confirmed'`,
    [user_id, course_id]
  );
  if (confirmed.rows.length > 0) throw ApiError.badRequest('You already have access to this course.');

  // Проверка: есть ли активные заявки (pending, invoiced)
  const active = await pool.query(
    `SELECT id FROM payments WHERE user_id = $1 AND course_id = $2 AND status IN ('pending', 'invoiced')`,
    [user_id, course_id]
  );
  if (active.rows.length > 0) throw ApiError.badRequest('You already have an active payment request for this course.');

  // Проверка: последняя заявка должна быть rejected или expired
  const last = await pool.query(
    `SELECT id, status, payment_expires_at FROM payments WHERE user_id = $1 AND course_id = $2 ORDER BY created_at DESC LIMIT 1`,
    [user_id, course_id]
  );
  if (last.rows.length === 0) throw ApiError.badRequest('No previous payment request found for this course.');
  const lastStatus = last.rows[0].status;
  const isExpired = lastStatus === 'pending' && new Date(last.rows[0].payment_expires_at) < new Date();
  if (!(lastStatus === 'rejected' || isExpired)) {
    throw ApiError.badRequest('Retry is only allowed after rejection or expiration of the last request.');
  }

  // Создать новую заявку
  return await createPaymentRequest({ user_id, course_id, phone });
}

// Получить все заявки (админ, с фильтрацией)
async function getAllPaymentsAdmin({ status, user_id, course_id }) {
  let query = `
    SELECT p.*, u.email as user_email, u.name as user_name, c.title as course_title, c.price as course_price
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN courses c ON p.course_id = c.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;
  if (status) {
    query += ` AND p.status = $${idx++}`;
    params.push(status);
  }
  if (user_id) {
    query += ` AND p.user_id = $${idx++}`;
    params.push(user_id);
  }
  if (course_id) {
    query += ` AND p.course_id = $${idx++}`;
    params.push(course_id);
  }
  query += ' ORDER BY p.created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = {
  createPayment,
  getPaymentById,
  confirmPayment,
  checkCourseAccess,
  getAccessibleCourses,
  getPendingPayments,
  createPaymentRequest,
  getAllPayments,
  invoicePayment,
  rejectPayment,
  getPaymentsByUser,
  deletePayment,
  retryPayment,
  getAllPaymentsAdmin
}; 