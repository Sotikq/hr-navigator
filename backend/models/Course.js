const pool = require('../config/db');

// 🔹 Создание курса
async function createCourse({ title, description, details, price, duration, coverUrl, category, authorId, is_published }) {
  const query = `
    INSERT INTO courses (title, description, details, price, duration, cover_url, category, author_id, is_published)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const values = [title, description, details, price, duration, coverUrl, category, authorId, is_published];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 🔹 Получение всех опубликованных курсов (для главной страницы)
async function getPublishedCourses() {
  const query = `
    SELECT * FROM courses WHERE is_published = true ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// 🔹 Получение курса по ID
async function getCourseById(courseId) {
  const query = `
    SELECT * FROM courses WHERE id = $1
  `;
  const { rows } = await pool.query(query, [courseId]);
  return rows[0];
}

// 🔹 Получение всех курсов определённого преподавателя (в его личном кабинете)
async function getCoursesByAuthor(authorId) {
  const query = `
    SELECT * FROM courses WHERE author_id = $1 ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [authorId]);
  return rows;
}

module.exports = {
  createCourse,
  getPublishedCourses,
  getCourseById,
  getCoursesByAuthor,
};
