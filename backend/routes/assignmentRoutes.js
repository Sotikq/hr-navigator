const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/authMiddleware');

// Настройка Multer для загрузки файлов заданий
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = req.path.includes('/submit') ? 
      'uploads/assignments/submissions' : 'uploads/assignments/files';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const assignmentUpload = multer({
  storage: assignmentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Разрешенные типы файлов
    const allowedTypes = /\.(pdf|doc|docx|txt|jpg|jpeg|png|zip|rar)$/i;
    if (allowedTypes.test(path.extname(file.originalname))) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, images and archives are allowed'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Домашние задания
 */

/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Создать домашнее задание (учитель)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: Файл задания (опционально)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - title
 *               - description
 *             properties:
 *               courseId:
 *                 type: string
 *               lessonId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               instructions:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               maxPoints:
 *                 type: integer
 *                 default: 100
 *     responses:
 *       201:
 *         description: Задание создано
 *       403:
 *         description: Доступ запрещен
 */
router.post('/', authMiddleware, assignmentUpload.single('file'), assignmentController.createAssignment);

/**
 * @swagger
 * /assignments/course/{courseId}:
 *   get:
 *     summary: Получить все задания курса
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список заданий курса
 */
router.get('/course/:courseId', authMiddleware, assignmentController.getAssignmentsByCourse);

/**
 * @swagger
 * /assignments/{assignmentId}:
 *   get:
 *     summary: Получить задание по ID
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные задания
 *       404:
 *         description: Задание не найдено
 */
router.get('/:assignmentId', authMiddleware, assignmentController.getAssignmentById);

/**
 * @swagger
 * /assignments/{assignmentId}/submit:
 *   post:
 *     summary: Сдать домашнее задание (студент)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: file
 *         type: file
 *         description: Файл работы (опционально)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Текст работы
 *     responses:
 *       201:
 *         description: Работа сдана
 *       400:
 *         description: Срок сдачи истек
 *       403:
 *         description: Только студенты могут сдавать задания
 */
router.post('/:assignmentId/submit', authMiddleware, assignmentUpload.single('file'), assignmentController.submitAssignment);

/**
 * @swagger
 * /assignments/{assignmentId}/submissions:
 *   get:
 *     summary: Получить все сдачи задания (учитель)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список сдач
 *       403:
 *         description: Доступ запрещен
 */
router.get('/:assignmentId/submissions', authMiddleware, assignmentController.getSubmissionsForAssignment);

/**
 * @swagger
 * /assignments/submissions/student:
 *   get:
 *     summary: Получить сдачи текущего студента
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Фильтр по курсу
 *     responses:
 *       200:
 *         description: Список сдач студента
 */
router.get('/submissions/student', authMiddleware, assignmentController.getStudentSubmissions);

/**
 * @swagger
 * /assignments/submissions/student/{studentId}:
 *   get:
 *     summary: Получить сдачи конкретного студента (для учителей и админов)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID студента
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Фильтр по курсу
 *     responses:
 *       200:
 *         description: Список сдач студента
 */
router.get('/submissions/student/:studentId', authMiddleware, assignmentController.getStudentSubmissions);

/**
 * @swagger
 * /assignments/submissions/{submissionId}/grade:
 *   put:
 *     summary: Оценить сдачу задания (учитель)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
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
 *               - points
 *             properties:
 *               points:
 *                 type: integer
 *                 minimum: 0
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Оценка выставлена
 *       403:
 *         description: Только учителя могут оценивать
 *       404:
 *         description: Сдача не найдена
 */
router.put('/submissions/:submissionId/grade', authMiddleware, assignmentController.gradeSubmission);

/**
 * @swagger
 * /assignments/{assignmentId}:
 *   put:
 *     summary: Обновить задание (учитель)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: file
 *         type: file
 *         description: Новый файл задания (опционально)
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
 *               instructions:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               maxPoints:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Задание обновлено
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Задание не найдено
 */
router.put('/:assignmentId', authMiddleware, assignmentUpload.single('file'), assignmentController.updateAssignment);

/**
 * @swagger
 * /assignments/{assignmentId}:
 *   delete:
 *     summary: Удалить задание (учитель)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Задание удалено
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Задание не найдено
 */
router.delete('/:assignmentId', authMiddleware, assignmentController.deleteAssignment);

/**
 * @swagger
 * /assignments/course/{courseId}/stats:
 *   get:
 *     summary: Статистика заданий курса
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Статистика заданий
 */
router.get('/course/:courseId/stats', authMiddleware, assignmentController.getAssignmentStats);

module.exports = router; 