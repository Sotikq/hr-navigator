const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
const certificateService = require('../certificateService');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * @swagger
 * tags:
 *   - name: Certificates
 *     description: Certificate generation and management
 */

/**
 * @swagger
 * /certificates/generate/{courseId}:
 *   post:
 *     summary: Сгенерировать сертификат для завершенного курса
 *     description: |
 *       Генерирует сертификат в форматах PDF и JPG для пользователя, который:
 *       - Завершил курс на 100%
 *       - Подтвердил оплату
 *       - Еще не имеет сертификата для этого курса
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID курса
 *     responses:
 *       '201':
 *         description: Сертификат успешно сгенерирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     certificate_number:
 *                       type: string
 *                     pdf_path:
 *                       type: string
 *                     jpg_path:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       '400':
 *         description: Ошибка валидации или генерации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Course not completed or payment not confirmed"
 *       '401':
 *         description: Не авторизован
 *       '403':
 *         description: Неверный API ключ
 *       '409':
 *         description: Сертификат уже существует
 *       '500':
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /certificates:
 *   get:
 *     summary: Получить все сертификаты текущего пользователя
 *     description: Возвращает список всех сертификатов пользователя, отсортированных по дате создания
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     responses:
 *       '200':
 *         description: Список сертификатов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       certificate_number:
 *                         type: string
 *                       course_id:
 *                         type: string
 *                         format: uuid
 *                       pdf_path:
 *                         type: string
 *                       jpg_path:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       '401':
 *         description: Не авторизован
 *       '403':
 *         description: Неверный API ключ
 *       '500':
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /certificates/{id}/view/{format}:
 *   get:
 *     summary: Просмотр сертификата
 *     description: Отображает сертификат в браузере (inline)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID сертификата
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, jpg]
 *         description: Формат сертификата
 *     responses:
 *       '200':
 *         description: Файл сертификата
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: Неверный формат
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid format. Supported formats: pdf, jpg"
 *       '401':
 *         description: Не авторизован
 *       '403':
 *         description: Неверный API ключ
 *       '404':
 *         description: Сертификат не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Certificate not found"
 *       '500':
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /certificates/{id}/download/{format}:
 *   get:
 *     summary: Скачать сертификат
 *     description: Скачивает сертификат в выбранном формате
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID сертификата
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, jpg]
 *         description: Формат сертификата
 *     responses:
 *       '200':
 *         description: Файл сертификата для скачивания
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: Неверный формат
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid format. Supported formats: pdf, jpg"
 *       '401':
 *         description: Не авторизован
 *       '403':
 *         description: Неверный API ключ
 *       '404':
 *         description: Сертификат не найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Certificate not found"
 *       '500':
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /certificates/verify/{code}:
 *   get:
 *     summary: Проверить валидность сертификата
 *     description: Проверяет валидность сертификата по его номеру
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Номер сертификата
 *     responses:
 *       '200':
 *         description: Результат проверки сертификата
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [valid, revoked, error]
 *                 message:
 *                   type: string
 *                 certificate:
 *                   type: object
 *                   properties:
 *                     certificateNumber:
 *                       type: string
 *                     userName:
 *                       type: string
 *                     courseTitle:
 *                       type: string
 *                     issuedAt:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: number
 *                 details:
 *                   type: object
 *                   properties:
 *                     revokedAt:
 *                       type: string
 *                       format: date-time
 *                     revocationReason:
 *                       type: string
 *       '500':
 *         description: Внутренняя ошибка сервера
 */

// Публичный endpoint — ДО middleware авторизации!
router.get('/verify/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await certificateService.validateCertificate(code);
    res.json(result);
  } catch (error) {
    logger.error('Certificate validation failed', { error: error.message, code: req.params.code });
    next(new ApiError(500, 'Failed to validate certificate'));
  }
});

// Дальше — защищённые маршруты
router.use(authMiddleware);
router.use(apiKeyMiddleware());

// Generate certificate for a course
router.post('/generate/:courseId', certificateController.generateCertificate);

// Get all certificates for current user
router.get('/', certificateController.getUserCertificates);

// View certificate files
router.get('/:id/view/:format', certificateController.viewCertificate);

// Download certificate files
router.get('/:id/download/:format', certificateController.downloadCertificate);

module.exports = router;