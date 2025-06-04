const express = require('express');
const router = express.Router();
const {
  getMyTestResults,
  getMyCourseTestStatus,
  getCourseResults,
  getCourseStatistics,
  getUsersReadyForCertificateHandler,
  importFromGoogleSheets,
  getGoogleSheetInfo,
  getUserTestResultHandler,
  getAllTestResults
} = require('../controllers/testResultsController');
const { authMiddleware, validateApiKey, checkRole } = require('../middleware');

/**
 * @swagger
 * tags:
 *   name: Test Results
 *   description: Управление результатами тестов
 */

/**
 * @swagger
 * /test-results/my:
 *   get:
 *     summary: Получение результатов тестов текущего пользователя
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: ID курса (опционально, для фильтрации)
 *     responses:
 *       200:
 *         description: Список результатов тестов пользователя
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
 *       401:
 *         description: Не авторизован
 */
router.get('/my', authMiddleware, validateApiKey(), getMyTestResults);

/**
 * @swagger
 * /test-results/my/course/{courseId}:
 *   get:
 *     summary: Получение статуса прохождения тестов по курсу для текущего пользователя
 *     tags: [Test Results]
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
 *         description: Статус прохождения тестов по курсу
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
 *                     parts:
 *                       type: array
 *                     completed_parts:
 *                       type: integer
 *                     total_parts:
 *                       type: integer
 *                     total_score:
 *                       type: integer
 *                     total_max_score:
 *                       type: integer
 *                     overall_percentage:
 *                       type: number
 *                     is_completed:
 *                       type: boolean
 *                     passed:
 *                       type: boolean
 *       401:
 *         description: Не авторизован
 */
router.get('/my/course/:courseId', authMiddleware, validateApiKey(), getMyCourseTestStatus);

/**
 * @swagger
 * /test-results/my/course/{courseId}/part/{part}:
 *   get:
 *     summary: Получение результата конкретной части теста
 *     tags: [Test Results]
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
 *       - in: path
 *         name: part
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Номер части теста (любое положительное число)
 *     responses:
 *       200:
 *         description: Результат части теста
 *       401:
 *         description: Не авторизован
 */
router.get('/my/course/:courseId/part/:part', authMiddleware, validateApiKey(), getUserTestResultHandler);

/**
 * @swagger
 * /test-results/course/{courseId}:
 *   get:
 *     summary: Получение всех результатов тестов по курсу (только для админов)
 *     tags: [Test Results]
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
 *         description: Список всех результатов тестов по курсу
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав доступа
 */
router.get('/course/:courseId', authMiddleware, checkRole(['admin']), validateApiKey(), getCourseResults);

/**
 * @swagger
 * /test-results/course/{courseId}/statistics:
 *   get:
 *     summary: Получение статистики по курсу (только для админов)
 *     tags: [Test Results]
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
 *         description: Статистика по курсу
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
 *                       part:
 *                         type: integer
 *                       total_attempts:
 *                         type: integer
 *                       completed_attempts:
 *                         type: integer
 *                       average_score:
 *                         type: string
 *                       completion_rate:
 *                         type: number
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав доступа
 */
router.get('/course/:courseId/statistics', authMiddleware, checkRole(['admin']), validateApiKey(), getCourseStatistics);

/**
 * @swagger
 * /test-results/course/{courseId}/ready-for-certificate:
 *   get:
 *     summary: Получение пользователей, готовых к получению сертификата (только для админов)
 *     tags: [Test Results]
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
 *       - in: query
 *         name: passingScore
 *         schema:
 *           type: number
 *           default: 60
 *         description: Минимальный процент для прохождения
 *     responses:
 *       200:
 *         description: Список пользователей, готовых к получению сертификата
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав доступа
 */
router.get('/course/:courseId/ready-for-certificate', authMiddleware, checkRole(['admin']), validateApiKey(), getUsersReadyForCertificateHandler);

/**
 * @swagger
 * /test-results/import:
 *   post:
 *     summary: Импорт результатов из Google Sheets (только для админов)
 *     tags: [Test Results]
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
 *               - sheetId
 *               - courseId
 *               - part
 *             properties:
 *               sheetId:
 *                 type: string
 *                 description: ID Google Sheets (из URL)
 *                 example: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
 *               courseId:
 *                 type: string
 *                 description: ID курса в системе
 *               part:
 *                 type: integer
 *                 minimum: 1
 *                 description: Номер части теста (любое положительное число)
 *               range:
 *                 type: string
 *                 default: "A1:Z1000"
 *                 description: Диапазон ячеек для импорта
 *     responses:
 *       200:
 *         description: Результат импорта
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: integer
 *                     total_rows:
 *                       type: integer
 *                     errors:
 *                       type: array
 *       400:
 *         description: Неверные параметры
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав доступа
 */
router.post('/import', authMiddleware, checkRole(['admin']), validateApiKey(), importFromGoogleSheets);

/**
 * @swagger
 * /test-results/sheet-info/{sheetId}:
 *   get:
 *     summary: Получение информации о Google Sheet (только для админов)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sheetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Google Sheets
 *     responses:
 *       200:
 *         description: Информация о Google Sheet
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
 *                     title:
 *                       type: string
 *                     sheets:
 *                       type: array
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав доступа
 */
router.get('/sheet-info/:sheetId', authMiddleware, checkRole(['admin']), validateApiKey(), getGoogleSheetInfo);

/**
 * @swagger
 * /test-results/all:
 *   get:
 *     summary: Получение всех результатов тестов с пагинацией (только для админов)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество результатов на странице
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Фильтр по курсу
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Фильтр по пользователю
 *     responses:
 *       200:
 *         description: Список всех результатов тестов с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав доступа
 */
router.get('/all', authMiddleware, checkRole(['admin']), validateApiKey(), getAllTestResults);

module.exports = router; 