const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Настройка Multer для загрузки файлов в чат
const chatStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chat');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `chat-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const chatUpload = multer({
  storage: chatStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // Разрешенные типы файлов для чата
    const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i;
    if (allowedTypes.test(path.extname(file.originalname))) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF and documents are allowed in chat'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Личные сообщения
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Отправить личное сообщение
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: Файл вложения (опционально)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID получателя
 *               content:
 *                 type: string
 *                 description: Текст сообщения
 *               messageType:
 *                 type: string
 *                 enum: [text, file, image]
 *                 default: text
 *     responses:
 *       201:
 *         description: Сообщение отправлено
 *       400:
 *         description: Неверные данные
 *       403:
 *         description: Студенты могут писать только учителям
 *       404:
 *         description: Получатель не найден
 */
router.post('/', authMiddleware, chatUpload.single('file'), messageController.sendMessage);

/**
 * @swagger
 * /messages/chats:
 *   get:
 *     summary: Получить список всех чатов пользователя
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список чатов с последними сообщениями
 */
router.get('/chats', authMiddleware, messageController.getUserChats);

/**
 * @swagger
 * /messages/history/{userId}:
 *   get:
 *     summary: Получить историю сообщений с пользователем
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID собеседника
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество сообщений
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *     responses:
 *       200:
 *         description: История сообщений
 *       403:
 *         description: Доступ запрещен
 */
router.get('/history/:userId', authMiddleware, messageController.getMessageHistory);

/**
 * @swagger
 * /messages/unread-count:
 *   get:
 *     summary: Получить количество непрочитанных сообщений
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество непрочитанных сообщений
 */
router.get('/unread-count', authMiddleware, messageController.getUnreadCount);

/**
 * @swagger
 * /messages/mark-read/{senderId}:
 *   put:
 *     summary: Пометить сообщения как прочитанные
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: senderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID отправителя сообщений
 *     responses:
 *       200:
 *         description: Сообщения помечены как прочитанные
 */
router.put('/mark-read/:senderId', authMiddleware, messageController.markAsRead);

/**
 * @swagger
 * /messages/search:
 *   get:
 *     summary: Поиск сообщений по содержимому
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Максимальное количество результатов
 *     responses:
 *       200:
 *         description: Результаты поиска
 *       400:
 *         description: Поисковый запрос обязателен
 */
router.get('/search', authMiddleware, messageController.searchMessages);

/**
 * @swagger
 * /messages/contacts:
 *   get:
 *     summary: Получить список контактов для начала чата
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список доступных контактов
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
 *                       role:
 *                         type: string
 */
router.get('/contacts', authMiddleware, messageController.getChatContacts);

/**
 * @swagger
 * /messages/{messageId}:
 *   get:
 *     summary: Получить сообщение по ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные сообщения
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Сообщение не найдено
 */
router.get('/:messageId', authMiddleware, messageController.getMessageById);

/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     summary: Удалить сообщение (только отправитель)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Сообщение удалено
 *       403:
 *         description: Можно удалять только свои сообщения
 *       404:
 *         description: Сообщение не найдено
 */
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);

/**
 * @swagger
 * /messages/admin/stats:
 *   get:
 *     summary: Статистика сообщений (только для админа)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика сообщений
 *       403:
 *         description: Требуется доступ админа
 */
router.get('/admin/stats', authMiddleware, messageController.getMessageStats);

module.exports = router; 