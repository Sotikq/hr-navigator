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
  const query = `
    SELECT c.*, 
           m.id as module_id, m.title as module_title, m.description as module_description, m.position as module_position,
           t.id as topic_id, t.title as topic_title, t.description as topic_description, t.position as topic_position,
           l.id as lesson_id, l.title as lesson_title, l.description as lesson_description, l.type as lesson_type, 
           l.content_url as lesson_content_url, l.position as lesson_position
    FROM courses c
    LEFT JOIN modules m ON c.id = m.course_id
    LEFT JOIN topics t ON m.id = t.module_id
    LEFT JOIN lessons l ON t.id = l.topic_id
    WHERE c.id = $1
    ORDER BY m.position, t.position, l.position
  `;
  const { rows } = await pool.query(query, [courseId]);
  
  if (rows.length === 0) return null;

  // Transform the flat structure into a nested one
  const course = {
    ...rows[0],
    modules: []
  };

  let currentModule = null;
  let currentTopic = null;

  rows.forEach(row => {
    if (row.module_id && (!currentModule || currentModule.id !== row.module_id)) {
      currentModule = {
        id: row.module_id,
        title: row.module_title,
        description: row.module_description,
        position: row.module_position,
        topics: []
      };
      course.modules.push(currentModule);
    }

    if (row.topic_id && (!currentTopic || currentTopic.id !== row.topic_id)) {
      currentTopic = {
        id: row.topic_id,
        title: row.topic_title,
        description: row.topic_description,
        position: row.topic_position,
        lessons: []
      };
      currentModule.topics.push(currentTopic);
    }

    if (row.lesson_id) {
      currentTopic.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        description: row.lesson_description,
        type: row.lesson_type,
        content_url: row.lesson_content_url,
        position: row.lesson_position
      });
    }
  });

  return course;
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

// 🔹 Добавление темы к модулю
async function addTopic({ moduleId, title, description, position }) {
  const query = `
    INSERT INTO topics (module_id, title, description, position)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const values = [moduleId, title, description, position];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 🔹 Обновление темы
async function updateTopic(topicId, fieldsToUpdate) {
  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) return null;
  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [topicId, ...Object.values(fieldsToUpdate)];
  const query = `
    UPDATE topics
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 🔹 Удаление темы
async function deleteTopic(topicId, client = pool) {
  logger.info('deleteTopic() called', { topicId });
  try {
    const deleteTopicQuery = `
      DELETE FROM topics 
      WHERE id = $1
      RETURNING id
    `;
    logger.info('deleteTopic() executing query', { topicId });
    const { rows } = await client.query(deleteTopicQuery, [topicId]);
    logger.info('deleteTopic() query completed', { topicId });
    return rows[0];
  } catch (err) {
    logger.error('deleteTopic() error', { topicId, error: err });
    throw err;
  }
}

// 🔹 Добавление урока к теме
async function addLesson({ topicId, title, description, type, contentUrl, position }) {
  const query = `
    INSERT INTO lessons (topic_id, title, description, type, content_url, position)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [topicId, title, description, type, contentUrl, position];
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
  addTopic,
  updateTopic,
  deleteTopic,
  addLesson,
  updateLesson,
  deleteCourse,
  deleteModule,
  deleteLesson,
  getCoursesAssignedToTeacher
};
