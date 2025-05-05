const pool = require('../config/db');

// Получение всех видеоотзывов
async function getAllReviews() {
  const { rows } = await pool.query('SELECT * FROM video_reviews ORDER BY created_at DESC');
  return rows;
}

// Добавление нового видеоотзыва
async function addReview(videoUrl) {
  const { rows } = await pool.query(
    'INSERT INTO video_reviews (file_url) VALUES ($1) RETURNING *',
    [videoUrl]
  );
  return rows[0];
}

module.exports = { getAllReviews, addReview };
