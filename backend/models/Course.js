const pool = require('../config/db');
const logger = require('../utils/logger');
const { Pool } = require('pg');

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

// 🔹 Обновление курса
async function updateCourse(courseId, fieldsToUpdate) {
  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) return null;

  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [courseId, ...Object.values(fieldsToUpdate)];

  const query = `
    UPDATE courses
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 🔹 Получение всех опубликованных курсов
async function getPublishedCourses() {
  const query = `SELECT * FROM courses WHERE is_published = true ORDER BY created_at DESC`;
  const { rows } = await pool.query(query);
  return rows;
}

// 🔹 Получение всех неопубликованных курсов
async function getUnpublishedCourses() {
  const query = `SELECT * FROM courses WHERE is_published = false ORDER BY created_at DESC`;
  const { rows } = await pool.query(query);
  return rows;
}

// 🔹 Получение курса по ID
async function getCourseById(courseId) {
  const query = `SELECT * FROM courses WHERE id = $1`;
  const { rows } = await pool.query(query, [courseId]);
  return rows[0];
}

// 🔹 Получение курсов преподавателя
async function getCoursesByAuthor(authorId) {
  const query = `SELECT * FROM courses WHERE author_id = $1 ORDER BY created_at DESC`;
  const { rows } = await pool.query(query, [authorId]);
  return rows;
}

// 🔹 Добавление модуля к курсу
async function addModule({ courseId, title, description, position }) {
  const query = `
    INSERT INTO modules (course_id, title, description, position)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const values = [courseId, title, description, position];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 🔹 Обновление модуля
async function updateModule(moduleId, fieldsToUpdate) {
  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) return null;

  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [moduleId, ...Object.values(fieldsToUpdate)];

  const query = `
    UPDATE modules
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 🔹 Добавление урока к модулю
async function addLesson({ moduleId, title, description, type, contentUrl, position }) {
  const query = `
    INSERT INTO lessons (module_id, title, description, type, content_url, position)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [moduleId, title, description, type, contentUrl, position];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 🔹 Обновление урока
async function updateLesson(lessonId, fieldsToUpdate) {
  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) return null;

  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [lessonId, ...Object.values(fieldsToUpdate)];

  const query = `
    UPDATE lessons
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function deleteCourse(courseId, client = pool) {
  logger.info('deleteCourse() called', { courseId });
  try {
    const deleteCourseQuery = `
      DELETE FROM courses 
      WHERE id = $1
      RETURNING id
    `;
    logger.info('deleteCourse() executing query', { courseId });
    const { rows } = await client.query(deleteCourseQuery, [courseId]);
    logger.info('deleteCourse() query completed', { courseId });
    return rows[0];
  } catch (err) {
    logger.error('deleteCourse() error', { courseId, error: err });
    throw err;
  }
}

async function deleteModule(moduleId, client = pool) {
  logger.info('deleteModule() called', { moduleId });
  try {
    const deleteModuleQuery = `
      DELETE FROM modules 
      WHERE id = $1
      RETURNING id
    `;
    logger.info('deleteModule() executing query', { moduleId });
    const { rows } = await client.query(deleteModuleQuery, [moduleId]);
    logger.info('deleteModule() query completed', { moduleId });
    return rows[0];
  } catch (err) {
    logger.error('deleteModule() error', { moduleId, error: err });
    throw err;
  }
}

async function deleteLesson(lessonId, client = pool) {
  logger.info('deleteLesson() called', { lessonId });
  try {
    const query = `
      DELETE FROM lessons 
      WHERE id = $1
      RETURNING id
    `;
    logger.info('deleteLesson() executing query', { lessonId });
    const { rows } = await client.query(query, [lessonId]);
    logger.info('deleteLesson() query completed', { lessonId });
    return rows[0];
  } catch (err) {
    logger.error('deleteLesson() error', { lessonId, error: err });
    throw err;
  }
}

/**
 * Get all courses assigned to a specific teacher
 * @param {string} teacherId
 * @returns {Promise<Array>} List of courses
 */
async function getCoursesAssignedToTeacher(teacherId) {
  const query = `
    SELECT c.*
    FROM courses c
    INNER JOIN course_teachers ct ON c.id = ct.course_id
    WHERE ct.teacher_id = $1
    ORDER BY c.created_at DESC
  `;
  const { rows } = await pool.query(query, [teacherId]);
  return rows;
}

module.exports = {
  createCourse,
  updateCourse,
  getPublishedCourses,
  getUnpublishedCourses,
  getCourseById,
  getCoursesByAuthor,
  addModule,
  updateModule,
  addLesson,
  updateLesson,
  deleteCourse,
  deleteModule,
  deleteLesson,
  getCoursesAssignedToTeacher
};
