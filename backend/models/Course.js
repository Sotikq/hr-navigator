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

async function deleteCourse(courseId) {
  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete all lessons in the course's modules
    const deleteLessonsQuery = `
      DELETE FROM lessons 
      WHERE module_id IN (
        SELECT id FROM modules WHERE course_id = $1
      )
    `;
    await client.query(deleteLessonsQuery, [courseId]);

    // Delete all modules in the course
    const deleteModulesQuery = `
      DELETE FROM modules 
      WHERE course_id = $1
    `;
    await client.query(deleteModulesQuery, [courseId]);

    // Delete the course
    const deleteCourseQuery = `
      DELETE FROM courses 
      WHERE id = $1
      RETURNING id
    `;
    const { rows } = await client.query(deleteCourseQuery, [courseId]);

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteModule(moduleId) {
  // Start a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete all lessons in the module
    const deleteLessonsQuery = `
      DELETE FROM lessons 
      WHERE module_id = $1
    `;
    await client.query(deleteLessonsQuery, [moduleId]);

    // Delete the module
    const deleteModuleQuery = `
      DELETE FROM modules 
      WHERE id = $1
      RETURNING id
    `;
    const { rows } = await client.query(deleteModuleQuery, [moduleId]);

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteLesson(lessonId) {
  const query = `
    DELETE FROM lessons 
    WHERE id = $1
    RETURNING id
  `;
  const { rows } = await pool.query(query, [lessonId]);
  return rows[0];
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
  deleteLesson
};
