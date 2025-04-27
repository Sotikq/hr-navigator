// 📦 Первым делом загружаем переменные окружения
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path'); // для правильной работы статики
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./swaggerOptions');

// 🌐 Middleware
app.use(cors());
app.use(express.json());

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 📂 Статическая папка для обложек и других загружаемых файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📚 Маршруты
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');

// 🔒 Роуты авторизации (регистрация, логин)
app.use('/api/auth', authRoutes);

// 🔒 Роуты пользователя (профиль)
app.use('/api/auth', userRoutes);

// 📚 Роуты курсов
app.use('/api/courses', courseRoutes);

// 🌐 Главная страница для теста
app.get('/', (req, res) => {
  res.send('HR Navigator backend работает!');
});

// 🚀 Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
