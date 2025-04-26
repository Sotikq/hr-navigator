const express = require('express');
const router = express.Router();
const {
  createCourse,
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

// 🌐 Получение всех опубликованных курсов
router.get('/', getAllPublishedCourses);

// 🌐 Получение всех неопубликованных курсов
router.get('/unpublished', authMiddleware, getAllUnpublishedCourses);

// 🌐 Получение курса по ID (обязательно ниже /unpublished, чтобы не было конфликта)
router.get('/:id', getCourseById);

// 🔒 Получение всех курсов преподавателя
router.get('/my/all', authMiddleware, getMyCourses);

// 🔒 Добавление модуля к курсу
router.post('/:courseId/modules', authMiddleware, addModuleToCourse);

// 🔒 Добавление урока к модулю
router.post('/modules/:moduleId/lessons', authMiddleware, addLessonToModule);

module.exports = router;
