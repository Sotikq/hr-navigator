const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Аутентификация пользователей
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешная авторизация
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Получение профиля текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные профиля пользователя
 */
router.get('/me', authMiddleware, getProfile);

module.exports = router;
