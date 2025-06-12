// require('dotenv').config();
// const express = require('express');
// const paymentRoutes = require('./routes/paymentRoutes');

// const app = express();
// app.use(express.json());

// // Добавляем middleware для тестирования
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // Подключаем маршруты
// app.use('/api/payments', paymentRoutes);

// // Добавляем обработчик ошибок
// app.use((err, req, res, next) => {
//   console.error('Error:', err.message);
//   res.status(err.statusCode || 500).json({ error: err.message });
// });

// // Тестируем наличие маршрутов
// const port = 3001;
// app.listen(port, () => {
//   console.log(`Test server running on port ${port}`);
//   console.log('Available routes:');
//   console.log('PATCH /api/payments/:id/confirm');
//   console.log('PATCH /api/payments/:id/reject');
//   console.log('GET /api/payments/pending');
//   console.log('');
//   console.log('Test the routes manually or check if they are registered correctly.');
// }); 