const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  createCourse,
  updateCourse,
  updateModule,
  updateLesson,
  getAllPublishedCourses,
  getAllUnpublishedCourses,
  getCourseById,
  getMyCourses,
  addModuleToCourse,
  addLessonToModule
} = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Управление курсами
 */

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Создание нового курса
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - duration
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               details:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: string
 *               category:
 *                 type: string
 *               is_published:
 *                 type: boolean
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Курс успешно создан
 */
router.post('/', authMiddleware, upload.single('cover'), createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   patch:
 *     summary: Обновление курса
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               details:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: string
 *               category:
 *                 type: string
 *               is_published:
 *                 type: boolean
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Курс успешно обновлен
 */
router.patch('/:id', authMiddleware, upload.single('cover'), updateCourse);

/**
 * @swagger
 * /courses/modules/{id}:
 *   patch:
 *     summary: Обновление модуля
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID модуля
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Модуль успешно обновлен
 */
router.patch('/modules/:id', authMiddleware, updateModule);

/**
 * @swagger
 * /courses/lessons/{id}:
 *   patch:
 *     summary: Обновление урока
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID урока
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Урок успешно обновлен
 */
router.patch('/lessons/:id', authMiddleware, updateLesson);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Получение всех опубликованных курсов
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Список опубликованных курсов
 */
router.get('/', getAllPublishedCourses);

/**
 * @swagger
 * /courses/unpublished:
 *   get:
 *     summary: Получение всех неопубликованных курсов
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список неопубликованных курсов
 */
router.get('/unpublished', authMiddleware, getAllUnpublishedCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Получение курса по ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     responses:
 *       200:
 *         description: Информация о курсе
 */
router.get('/:id', getCourseById);

/**
 * @swagger
 * /courses/my/all:
 *   get:
 *     summary: Получение всех курсов текущего преподавателя
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список курсов преподавателя
 */
router.get('/my/all', authMiddleware, getMyCourses);

/**
 * @swagger
 * /courses/{courseId}/modules:
 *   post:
 *     summary: Добавление модуля к курсу
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Модуль успешно создан
 */
router.post('/:courseId/modules', authMiddleware, addModuleToCourse);

/**
 * @swagger
 * /courses/modules/{moduleId}/lessons:
 *   post:
 *     summary: Добавление урока к модулю
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID модуля
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               content_url:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Урок успешно создан
 */
router.post('/modules/:moduleId/lessons', authMiddleware, addLessonToModule);

module.exports = router;
