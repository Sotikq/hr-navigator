const express = require('express');
const router = express.Router();
const {
  createCourseDetailsHandler,
  getCourseDetailsHandler,
  updateCourseDetailsHandler,
  deleteCourseDetailsHandler,
} = require('../controllers/courseDetailsController');
const { authMiddleware, checkRole, validateApiKey } = require('../middleware');

/**
 * @swagger
 * tags:
 *   name: CourseDetails
 *   description: Детальная информация о курсе
 */

/**
 * @swagger
 * /course-details:
 *   post:
 *     summary: Создать детали курса (только для админов и преподавателей)
 *     tags: [CourseDetails]
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
 *               target_audience:
 *                 type: string
 *               learning_outcomes:
 *                 type: string
 *               study_details:
 *                 type: string
 *               study_period:
 *                 type: string
 *               goal:
 *                 type: string
 *     responses:
 *       201:
 *         description: Детали курса успешно созданы
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Недостаточно прав
 */
router.post('/', authMiddleware, checkRole(['admin', 'teacher']), validateApiKey(), createCourseDetailsHandler);

/**
 * @swagger
 * /course-details/{courseId}:
 *   get:
 *     summary: Получить детали курса по course_id
 *     tags: [CourseDetails]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     responses:
 *       200:
 *         description: Детали курса
 *       404:
 *         description: Не найдено
 */
router.get('/:courseId', getCourseDetailsHandler);

/**
 * @swagger
 * /course-details/{courseId}:
 *   patch:
 *     summary: Обновить детали курса (только для админов и преподавателей)
 *     tags: [CourseDetails]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target_audience:
 *                 type: string
 *               learning_outcomes:
 *                 type: string
 *               study_details:
 *                 type: string
 *               study_period:
 *                 type: string
 *               goal:
 *                 type: string
 *     responses:
 *       200:
 *         description: Детали курса обновлены
 *       404:
 *         description: Не найдено
 */
router.patch('/:courseId', authMiddleware, checkRole(['admin', 'teacher']), validateApiKey(), updateCourseDetailsHandler);

/**
 * @swagger
 * /course-details/{courseId}:
 *   delete:
 *     summary: Удалить детали курса (только для админов)
 *     tags: [CourseDetails]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     responses:
 *       200:
 *         description: Детали курса удалены
 *       404:
 *         description: Не найдено
 */
router.delete('/:courseId', authMiddleware, checkRole(['admin']), validateApiKey(), deleteCourseDetailsHandler);

module.exports = router; 