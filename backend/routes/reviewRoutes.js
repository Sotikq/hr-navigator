const express = require('express');
const router = express.Router();
const { getReviewsHandler, addReviewHandler } = require('../controllers/reviewController');
const { uploadVideo } = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Работа с видеоотзывами
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Получение всех видеоотзывов
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Список видеоотзывов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   video_url:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Загрузка нового видеоотзыва
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Отзыв успешно загружен
 *       400:
 *         description: Файл не предоставлен
 */
router.get('/', getReviewsHandler);
router.post('/', authMiddleware, uploadVideo.single('video'), addReviewHandler);

module.exports = router;
