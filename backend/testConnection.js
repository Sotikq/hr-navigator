require('dotenv').config(); // должно быть первым!
const pool = require('./config/db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Ошибка подключения:', err);
  } else {
    console.log('Успешное подключение к БД. Время:', res.rows[0]);
  }
  pool.end();
});
