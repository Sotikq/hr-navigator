// 📦 Первым делом загружаем переменные окружения
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path'); // для правильной работы статики
const morgan = require('morgan');
const { errorHandler, authMiddleware } = require('./middleware');
const logger = require('./utils/logger');

const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./swaggerOptions');

// 🌐 Middleware
app.use(cors());
app.use(express.json());

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Добавь рядом с другими static:
app.use('/uploads/reviews', express.static(path.join(__dirname, 'uploads/reviews')));

// 📂 Статическая папка для обложек и других загружаемых файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📚 Маршруты
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// 🔒 Роуты авторизации (регистрация, логин)
app.use('/api/auth', authRoutes);

// 🔒 Роуты пользователя (профиль)
app.use('/api/auth', userRoutes);

// 📚 Роуты курсов
app.use('/api/courses', courseRoutes);

// 📝 Роуты отзывов
app.use('/api/reviews', reviewRoutes);

// 🌐 Главная страница для теста
app.get('/', (req, res) => {
  res.send('HR Navigator backend is running!');
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
    stack: reason.stack
  });
  // Don't crash the server
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  // Give logger time to write before crashing
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// 🚀 Запуск сервера
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server started on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});
