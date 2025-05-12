const express = require('express');
const router = express.Router();
const { getProfile, updateName, updatePassword, getAllTeachersList } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Получение профиля текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 */
router.get('/me', authMiddleware, getProfile);

/**
 * @swagger
 * /auth/me/name:
 *   patch:
 *     summary: Обновление имени пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Имя обновлено
 */
router.patch('/me/name', authMiddleware, updateName);

/**
 * @swagger
 * /auth/me/password:
 *   patch:
 *     summary: Обновление пароля пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пароль обновлен
 */
router.patch('/me/password', authMiddleware, updatePassword);

/**
 * @swagger
 * /api/users/teachers:
 *   get:
 *     summary: Get all teachers (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *       403:
 *         description: Forbidden - Only administrators can access this endpoint
 */
router.get('/teachers', authMiddleware, checkRole(['admin']), getAllTeachersList);

module.exports = router;
