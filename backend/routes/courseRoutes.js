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
  assignTeacher,
  deleteCourse: deleteCourseHandler,
  deleteModule: deleteModuleHandler,
  deleteLesson: deleteLessonHandler,
  checkCourseAccess: checkCourseAccessHandler,
  addTopicToModule,
  updateTopic,
  deleteTopic,
  addLessonToTopic
} = require('../controllers/courseController');
const { authMiddleware, validateApiKey, checkRole } = require('../middleware');
const { checkCourseAccessHandler: paymentCheckCourseAccessHandler } = require('../controllers/paymentController');

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
 *       - ApiKeyAuth: []
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
 *       - ApiKeyAuth: []
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
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 description: Module title
 *               description:
 *                 type: string
 *                 description: Module description
 *               position:
 *                 type: integer
 *                 description: Position in course
 *     responses:
 *       200:
 *         description: Модуль успешно обновлен
 */
router.patch('/modules/:id', authMiddleware, validateApiKey(), updateModule);

/**
 * @swagger
 * /courses/lessons/{id}:
 *   patch:
 *     summary: Обновление урока
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID урока
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Lesson title
 *               description:
 *                 type: string
 *                 description: Lesson description
 *               type:
 *                 type: string
 *                 enum: [video, test, pdf]
 *                 description: Lesson type
 *               content_url:
 *                 type: string
 *                 description: URL to lesson content
 *               position:
 *                 type: integer
 *                 description: Position in topic
 *     responses:
 *       200:
 *         description: Урок успешно обновлен
 */
router.patch('/lessons/:id', authMiddleware, validateApiKey(), updateLesson);

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
 *           type: string
 *           format: uuid
 *         description: ID курса
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
 * /courses/{id}/assign-teacher:
 *   post:
 *     summary: Назначение преподавателя на курс (только для администраторов)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
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
 *     summary: Delete a course and all its modules, topics, and lessons (admin only)
 *     description: Удаляет курс, а также все его модули, темы и уроки (только для администратора)
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Deleted successfully
 *       403:
 *         description: Forbidden - Only administrators can delete courses
 *       404:
 *         description: Course not found
 */
router.delete('/:id',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey(),
  deleteCourseHandler
);

/**
 * @swagger
 * /courses/modules/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a module and all its topics and lessons (admin only)
 *     description: Удаляет модуль, а также все его темы и уроки (только для администратора)
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Deleted successfully
 *       403:
 *         description: Forbidden - Only administrators can delete modules
 *       404:
 *         description: Module not found
 */
router.delete('/modules/:id',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey(),
  deleteModuleHandler
);

/**
 * @swagger
 * /courses/lessons/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a lesson (admin only)
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Deleted successfully
 *       403:
 *         description: Forbidden - Only administrators can delete lessons
 *       404:
 *         description: Lesson not found
 */
router.delete('/lessons/:id',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey(),
  deleteLessonHandler
);

/**
 * @swagger
 * /api/courses/{id}/access:
 *   get:
 *     tags: [Courses]
 *     summary: Check if user has access to course
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course access status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAccess:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.get('/:id/access',
  authMiddleware,
  validateApiKey(),
  paymentCheckCourseAccessHandler
);

/**
 * @swagger
 * /courses/modules/{moduleId}/topics:
 *   post:
 *     tags: [Courses]
 *     summary: Add a new topic to a module
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID модуля
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
 *         description: Topic created successfully
 *       404:
 *         description: Module not found
 */
router.post('/modules/:moduleId/topics', authMiddleware, checkRole(['admin', 'teacher']), addTopicToModule);

/**
 * @swagger
 * /courses/topics/{id}:
 *   patch:
 *     summary: Update topic
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Topic title
 *               description:
 *                 type: string
 *                 description: Topic description
 *               position:
 *                 type: integer
 *                 description: Position in module
 *     responses:
 *       200:
 *         description: Topic updated successfully
 *       404:
 *         description: Topic not found
 */
router.patch('/topics/:id', authMiddleware, checkRole(['admin', 'teacher']), updateTopic);

/**
 * @swagger
 * /courses/topics/{id}:
 *   delete:
 *     summary: Delete topic
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topic deleted successfully
 *       404:
 *         description: Topic not found
 */
router.delete('/topics/:id', authMiddleware, checkRole(['admin', 'teacher']), deleteTopic);

/**
 * @swagger
 * /courses/topics/{topicId}/lessons:
 *   post:
 *     tags: [Courses]
 *     summary: Add a new lesson to a topic
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
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
 *                 description: Lesson title
 *               description:
 *                 type: string
 *                 description: Lesson description
 *               type:
 *                 type: string
 *                 enum: [video, test, pdf]
 *                 description: Lesson type
 *               content_url:
 *                 type: string
 *                 description: URL to lesson content
 *               position:
 *                 type: integer
 *                 description: Position in topic
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       404:
 *         description: Topic not found
 */
router.post('/topics/:topicId/lessons', authMiddleware, checkRole(['admin', 'teacher']), addLessonToTopic);

module.exports = router;
