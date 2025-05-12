const express = require('express');
const router = express.Router();
const { uploadImage } = require('../middleware/uploadMiddleware');
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
  addLessonToModule,
  assignTeacher,
  deleteCourse,
  deleteModule,
  deleteLesson
} = require('../controllers/courseController');
const { authMiddleware, validateApiKey, checkRole } = require('../middleware');

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
 *     summary: Создание нового курса (только для администраторов)
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
 *       403:
 *         description: Недостаточно прав для создания курса
 */
router.post('/', 
  authMiddleware,
  checkRole(['admin']),
  validateApiKey(), 
  uploadImage.single('cover'), 
  createCourse
);

/**
 * @swagger
 * /courses/{id}:
 *   patch:
 *     summary: Обновление курса (только для администраторов и назначенных преподавателей)
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
 *       403:
 *         description: Недостаточно прав для обновления курса
 *       404:
 *         description: Курс не найден
 */
router.patch('/:id', 
  authMiddleware,
  checkRole(['admin', 'teacher']),
  validateApiKey(), 
  uploadImage.single('cover'), 
  updateCourse
);

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
router.patch('/modules/:id', 
  authMiddleware, 
  validateApiKey(), 
  updateModule
);

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
router.patch('/lessons/:id', 
  authMiddleware, 
  validateApiKey(), 
  updateLesson
);

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
 *     summary: Get all unpublished courses (admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unpublished courses
 *       403:
 *         description: Forbidden - Only administrators can access unpublished courses
 */
router.get('/unpublished', 
  authMiddleware, 
  checkRole(['admin']), 
  getAllUnpublishedCourses
);

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
 *     summary: Получение курсов (для администраторов - все курсы, для преподавателей - назначенные курсы)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список курсов
 *       403:
 *         description: Недостаточно прав для доступа
 */
router.get('/my/all', 
  authMiddleware,
  checkRole(['admin', 'teacher']),
  getMyCourses
);

/**
 * @swagger
 * /courses/{courseId}/modules:
 *   post:
 *     tags: [Courses]
 *     summary: Add a new module to a course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Module created successfully
 *       403:
 *         description: Forbidden - User not authorized
 *       404:
 *         description: Course not found
 */
router.post('/:courseId/modules', authMiddleware, checkRole(['admin', 'teacher']), addModuleToCourse);

/**
 * @swagger
 * /courses/modules/{moduleId}/lessons:
 *   post:
 *     tags: [Courses]
 *     summary: Add a new lesson to a module
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, text, quiz]
 *               content_url:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       403:
 *         description: Forbidden - User not authorized
 *       404:
 *         description: Module not found
 */
router.post('/modules/:moduleId/lessons', authMiddleware, checkRole(['admin', 'teacher']), addLessonToModule);

/**
 * @swagger
 * /courses/{id}/assign-teacher:
 *   post:
 *     summary: Назначение преподавателя на курс (только для администраторов)
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_id
 *             properties:
 *               teacher_id:
 *                 type: string
 *                 description: ID преподавателя
 *     responses:
 *       201:
 *         description: Преподаватель успешно назначен на курс
 *       400:
 *         description: Неверный ID преподавателя или преподаватель уже назначен
 *       403:
 *         description: Недостаточно прав для назначения преподавателя
 *       404:
 *         description: Курс не найден
 */
router.post('/:id/assign-teacher',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey(),
  assignTeacher
);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a course and all its modules and lessons (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Course deleted successfully
 *       403:
 *         description: Forbidden - Only administrators can delete courses
 *       404:
 *         description: Course not found
 */
router.delete('/:id',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey,
  deleteCourse
);

/**
 * @swagger
 * /courses/modules/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a module and all its lessons (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Module deleted successfully
 *       403:
 *         description: Forbidden - Only administrators can delete modules
 *       404:
 *         description: Module not found
 */
router.delete('/modules/:id',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey,
  deleteModule
);

/**
 * @swagger
 * /courses/lessons/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a lesson (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Lesson deleted successfully
 *       403:
 *         description: Forbidden - Only administrators can delete lessons
 *       404:
 *         description: Lesson not found
 */
router.delete('/lessons/:id',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey,
  deleteLesson
);

module.exports = router;
