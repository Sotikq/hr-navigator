const pool = require('../config/db');

// Создать детали курса
async function createCourseDetails({ course_id, target_audience, learning_outcomes, study_details, study_period, goal }) {
  const query = `
    INSERT INTO course_details (course_id, target_audience, learning_outcomes, study_details, study_period, goal)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [course_id, target_audience, learning_outcomes, study_details, study_period, goal];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// Получить детали по course_id
async function getCourseDetailsByCourseId(course_id) {
  const query = `SELECT * FROM course_details WHERE course_id = $1`;
  const { rows } = await pool.query(query, [course_id]);
  return rows[0] || null;
}

// Обновить детали курса
async function updateCourseDetails(course_id, fieldsToUpdate) {
  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) return null;
  const setClause = keys.map((key, idx) => `${key} = $${idx + 2}`).join(', ');
  const values = [course_id, ...Object.values(fieldsToUpdate)];
  const query = `
    UPDATE course_details
    SET ${setClause}, updated_at = now()
    WHERE course_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// Удалить детали курса
async function deleteCourseDetails(course_id) {
  const query = `DELETE FROM course_details WHERE course_id = $1 RETURNING *`;
  const { rows } = await pool.query(query, [course_id]);
  return rows[0];
}

module.exports = {
  createCourseDetails,
  getCourseDetailsByCourseId,
  updateCourseDetails,
  deleteCourseDetails,
}; 