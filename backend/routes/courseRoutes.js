const express = require('express');
const router = express.Router();
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

// 🔒 Создание нового курса
router.post('/', authMiddleware, createCourse);

// 🔒 Обновление курса
router.patch('/:id', authMiddleware, updateCourse);

// 🔒 Обновление модуля
router.patch('/modules/:id', authMiddleware, updateModule);

// 🔒 Обновление урока
router.patch('/lessons/:id', authMiddleware, updateLesson);

// 🌐 Получение всех опубликованных курсов
router.get('/', getAllPublishedCourses);

// 🌐 Получение всех неопубликованных курсов
router.get('/unpublished', authMiddleware, getAllUnpublishedCourses);

// 🌐 Получение курса по ID
router.get('/:id', getCourseById);

// 🔒 Получение всех курсов преподавателя
router.get('/my/all', authMiddleware, getMyCourses);

// 🔒 Добавление модуля к курсу
router.post('/:courseId/modules', authMiddleware, addModuleToCourse);

// 🔒 Добавление урока к модулю
router.post('/modules/:moduleId/lessons', authMiddleware, addLessonToModule);

module.exports = router;
