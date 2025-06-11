// 📦 Первым делом загружаем переменные окружения
require('dotenv').config();

// 📁 Создаем необходимые папки при запуске
const fs = require('fs');
const createDirectories = require('./createDirectories');

// Запускаем создание папок
if (require.main === module) {
  // Только если запускаем напрямую, а не через тесты
  try {
    require('./createDirectories');
  } catch (err) {
    console.log('Directory creation script not found, creating directories manually...');
    
    const directories = [
      'uploads/assignments',
      'uploads/chat', 
      'uploads/assignments/submissions',
      'uploads/assignments/files'
    ];
    
    directories.forEach(dir => {
      const fullPath = require('path').join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }
}

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
const emailRoutes = require('./routes/emailRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// 🔒 Роуты авторизации (регистрация, логин)
app.use('/api/auth', authRoutes);

// 🔒 Роуты пользователя (профиль)
app.use('/api/auth', userRoutes);

// 📚 Роуты курсов
app.use('/api/courses', courseRoutes);

// 📝 Роуты отзывов
app.use('/api/uploads', reviewRoutes);

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

// 📧 Email сервисы
app.use('/api/email', emailRoutes);

// 📝 Домашние задания
app.use('/api/assignments', assignmentRoutes);

// 💬 Личные сообщения
app.use('/api/messages', messageRoutes);

// 📊 Аналитика (только для админа)
app.use('/api/analytics', analyticsRoutes);

// 🌐 Главная страница для теста
app.get('/', (req, res) => {
  res.send('HR Navigator backend is running!');
});

// 🏥 Health Check Endpoints
app.get('/api/healthz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    const startTime = process.hrtime();
    await pool.query('SELECT 1');
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const dbResponseTime = seconds * 1000 + nanoseconds / 1000000;
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime.toFixed(2)}ms`
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies
    await pool.query('SELECT 1');
    
    // Check if uploads directory exists
    const uploadsPath = path.join(__dirname, 'uploads');
    const uploadsExist = require('fs').existsSync(uploadsPath);
    
    const services = {
      database: 'ready',
      filesystem: uploadsExist ? 'ready' : 'not_ready',
      api: 'ready'
    };
    
    const allReady = Object.values(services).every(status => status === 'ready');
    
    res.status(allReady ? 200 : 503).json({
      status: allReady ? 'ready' : 'not_ready',
      services,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/live', (req, res) => {
  // Simple liveness check - if this endpoint responds, the service is alive
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    version: require('./package.json').version
  });
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
