// 📦 Первым делом загружаем переменные окружения
require('dotenv').config();

const express = require('express');
const path = require('path'); // для правильной работы статики
const morgan = require('morgan');
const helmet = require('helmet');
const { errorHandler, authMiddleware, defaultLimiter } = require('./middleware');
const logger = require('./utils/logger');
const corsMiddleware = require('./config/cors');
const pool = require('./config/db');

// Validate required environment variables
const requiredEnvVars = ['API_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', { missing: missingEnvVars });
  process.exit(1);
}

const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./swaggerOptions');

// 🌐 Middleware
// Apply Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
      imgSrc: ["'self'", "data:", "https:"], // Allow images from any HTTPS source
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Swagger UI
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Required for file uploads
}));

// Remove X-Powered-By header
app.disable('x-powered-by');

// Apply configured CORS middleware
app.use(corsMiddleware);

app.use(express.json());

// Apply rate limiting to all requests
app.use(defaultLimiter);

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Добавь рядом с другими static:
app.use('/uploads/reviews', express.static(path.join(__dirname, 'uploads/reviews')));

// 📂 Статическая папка для обложек и других загружаемых файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📂 Публичная папка для верификации сертификатов
app.use(express.static(path.join(__dirname, 'public')));

// 📚 Маршруты
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const lessonProgressRoutes = require('./routes/lessonProgressRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const testResultsRoutes = require('./routes/testResultsRoutes');
const courseDetailsRoutes = require('./routes/courseDetailsRoutes');

// 🔒 Роуты авторизации (регистрация, логин)
app.use('/api/auth', authRoutes);

// 🔒 Роуты пользователя (профиль)
app.use('/api/auth', userRoutes);

// 📚 Роуты курсов
app.use('/api/courses', courseRoutes);

// 📝 Роуты отзывов
app.use('/api/reviews', reviewRoutes);

// 💰 Роуты платежей
app.use('/api/payments', paymentRoutes);

// 📚 Роуты прогресса уроков
app.use('/api/progress', lessonProgressRoutes);

// 📜 Роуты сертификатов
app.use('/api/certificates', certificateRoutes);

// 📊 Роуты результатов тестов
app.use('/api/test-results', testResultsRoutes);

// 📚 Роуты деталей курса
app.use('/api/course-details', courseDetailsRoutes);

// 🌐 Главная страница для теста
app.get('/', (req, res) => {
  res.send('HR Navigator backend is running!');
});

app.get('/api/healthz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 🔒 Роуты учителя
app.use('/api', teacherRoutes);


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
