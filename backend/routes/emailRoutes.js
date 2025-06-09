const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const emailService = require('../services/emailService');
const { findUserByEmail, findUserById } = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * @swagger
 * tags:
 *   name: Email
 *   description: Email сервисы и уведомления
 */

/**
 * @swagger
 * /email/password-reset:
 *   post:
 *     summary: Запрос на сброс пароля
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ссылка для сброса пароля отправлена
 */
router.post('/password-reset', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new ApiError(400, 'Email is required');
    }
    
    const user = await findUserByEmail(email);
    if (!user) {
      // Не сообщаем что пользователь не найден по соображениям безопасности
      return res.json({ message: 'If email exists, reset link will be sent' });
    }
    
    // Создаем токен для сброса пароля (действует 1 час)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Отправляем email
    await emailService.sendPasswordReset(user, resetToken);
    
    logger.info('Password reset email sent', { userId: user.id, email });
    res.json({ message: 'If email exists, reset link will be sent' });
  } catch (err) {
    logger.error('Error sending password reset email:', err);
    next(err);
  }
});

/**
 * @swagger
 * /email/reset-password:
 *   post:
 *     summary: Сброс пароля с токеном
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      throw new ApiError(400, 'Token and new password are required');
    }
    
    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      throw new ApiError(400, 'Invalid token type');
    }
    
    const user = await findUserById(decoded.userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль в базе данных
    const pool = require('../config/db');
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, user.id]
    );
    
    logger.info('Password reset completed', { userId: user.id });
    res.json({ message: 'Password successfully reset' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(400, 'Invalid or expired token'));
    }
    logger.error('Error resetting password:', err);
    next(err);
  }
});

/**
 * @swagger
 * /email/bulk-send:
 *   post:
 *     summary: Массовая рассылка (только админ)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - content
 *               - type
 *             properties:
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [newsletter, promotion, announcement, update]
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Рассылка запущена
 */
router.post('/bulk-send', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { subject, content, type = 'newsletter', userIds } = req.body;
    
    if (!subject || !content) {
      throw new ApiError(400, 'Subject and content are required');
    }
    
    const pool = require('../config/db');
    let query = 'SELECT id, email, name FROM users WHERE is_active = true';
    let queryParams = [];
    
    // Если указаны конкретные пользователи
    if (userIds && userIds.length > 0) {
      query += ' AND id = ANY($1)';
      queryParams.push(userIds);
    }
    
    const { rows: users } = await pool.query(query, queryParams);
    
    if (users.length === 0) {
      throw new ApiError(400, 'No users found for sending');
    }
    
    // Запускаем массовую рассылку
    await emailService.sendBulkEmail(users, subject, content, type);
    
    logger.info('Bulk email initiated', { 
      adminId: req.user.id, 
      recipientCount: users.length, 
      subject,
      type 
    });
    
    res.json({ 
      message: 'Bulk email initiated', 
      recipientCount: users.length 
    });
  } catch (err) {
    logger.error('Error sending bulk email:', err);
    next(err);
  }
});

/**
 * @swagger
 * /email/test:
 *   post:
 *     summary: Тест email сервиса (только админ)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Тест email отправлен
 */
router.post('/test', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { to, subject, message = 'Тестовое сообщение от HR Navigator' } = req.body;
    
    if (!to || !subject) {
      throw new ApiError(400, 'To and subject are required');
    }
    
    const html = `
      <h2>Тест Email Сервиса</h2>
      <p><strong>От:</strong> ${req.user.email}</p>
      <p><strong>Сообщение:</strong> ${message}</p>
      <p><strong>Время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
      <hr>
      <p><small>Это тестовое сообщение от HR Navigator</small></p>
    `;
    
    await emailService.sendEmail(to, subject, html);
    
    logger.info('Test email sent', { adminId: req.user.id, to, subject });
    res.json({ message: 'Test email sent successfully' });
  } catch (err) {
    logger.error('Error sending test email:', err);
    next(err);
  }
});

/**
 * @swagger
 * /email/queue-status:
 *   get:
 *     summary: Статус очереди email (только админ)
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статус очереди email
 */
router.get('/queue-status', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    queueLength: emailService.emailQueue.length,
    isProcessing: emailService.isProcessing,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 