const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Аналитика и статистика (только для админа)
 */

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Главный дашборд с общей статистикой
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Общая статистика платформы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_students:
 *                       type: integer
 *                     total_teachers:
 *                       type: integer
 *                     total_courses:
 *                       type: integer
 *                     total_payments:
 *                       type: integer
 *                     total_revenue:
 *                       type: number
 *                     total_certificates:
 *                       type: integer
 *                     conversion_rate:
 *                       type: string
 *                     avg_revenue_per_student:
 *                       type: string
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/dashboard', authMiddleware, adminMiddleware, analyticsController.getDashboard);

/**
 * @swagger
 * /analytics/sales:
 *   get:
 *     summary: Статистика продаж по периодам
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30 days"
 *         description: Период для анализа (например, "7 days", "30 days", "1 year")
 *     responses:
 *       200:
 *         description: Статистика продаж
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/sales', authMiddleware, adminMiddleware, analyticsController.getSalesAnalytics);

/**
 * @swagger
 * /analytics/courses/top:
 *   get:
 *     summary: Топ курсов по продажам
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество курсов в топе
 *     responses:
 *       200:
 *         description: Топ курсов
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/courses/top', authMiddleware, adminMiddleware, analyticsController.getTopCourses);

/**
 * @swagger
 * /analytics/students/activity:
 *   get:
 *     summary: Статистика активности студентов
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Активность студентов
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/students/activity', authMiddleware, adminMiddleware, analyticsController.getStudentActivity);

/**
 * @swagger
 * /analytics/courses/engagement:
 *   get:
 *     summary: Детальная статистика вовлеченности по курсам
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика вовлеченности курсов
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/courses/engagement', authMiddleware, adminMiddleware, analyticsController.getCourseEngagement);

/**
 * @swagger
 * /analytics/financial:
 *   get:
 *     summary: Финансовая аналитика
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата
 *     responses:
 *       200:
 *         description: Финансовая статистика
 *       400:
 *         description: Требуются начальная и конечная даты
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/financial', authMiddleware, adminMiddleware, analyticsController.getFinancialAnalytics);

/**
 * @swagger
 * /analytics/teachers:
 *   get:
 *     summary: Статистика преподавателей
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика преподавателей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       courses_created:
 *                         type: integer
 *                       total_sales:
 *                         type: integer
 *                       total_earnings:
 *                         type: number
 *                       unique_students:
 *                         type: integer
 *                       average_rating:
 *                         type: number
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/teachers', authMiddleware, adminMiddleware, analyticsController.getTeacherStats);

/**
 * @swagger
 * /analytics/funnel:
 *   get:
 *     summary: Конверсионная воронка
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30 days"
 *         description: Период для анализа
 *     responses:
 *       200:
 *         description: Данные конверсионной воронки
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/funnel', authMiddleware, adminMiddleware, analyticsController.getConversionFunnel);

/**
 * @swagger
 * /analytics/system:
 *   get:
 *     summary: Системная статистика
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Системная статистика
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/system', authMiddleware, adminMiddleware, analyticsController.getSystemStats);

/**
 * @swagger
 * /analytics/export:
 *   get:
 *     summary: Экспорт данных аналитики
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales, students]
 *         description: Тип данных для экспорта
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Формат экспорта
 *     responses:
 *       200:
 *         description: Экспортированные данные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Неверные параметры
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/export', authMiddleware, adminMiddleware, analyticsController.exportData);

/**
 * @swagger
 * /analytics/custom:
 *   get:
 *     summary: Кастомная аналитика с фильтрами
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Фильтр по курсу
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Фильтр по преподавателю
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           default: revenue
 *         description: Метрика для анализа
 *     responses:
 *       200:
 *         description: Кастомная аналитика
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/custom', authMiddleware, adminMiddleware, analyticsController.getCustomAnalytics);

module.exports = router; 