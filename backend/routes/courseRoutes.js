const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllPublishedCourses,
  getCourseById,
  getMyCourses
} = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔒 Создание курса (только для авторизованного преподавателя)
router.post('/', authMiddleware, createCourse);

// 🌐 Получение всех опубликованных курсов (для главной страницы)
router.get('/', getAllPublishedCourses);

// 🌐 Получение курса по ID (включает модули и уроки)
router.get('/:id', getCourseById);

// 🔒 Получение всех курсов преподавателя (личный кабинет)
router.get('/my/all', authMiddleware, getMyCourses);

module.exports = router;
