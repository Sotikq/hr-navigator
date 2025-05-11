const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Assign a teacher to a course
 * @param {string} courseId - Course ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Object>} The created assignment
 */
async function assignTeacherToCourse(courseId, teacherId) {
  // First verify the teacher exists and has teacher role
  const teacherQuery = `
    SELECT id, role FROM users 
    WHERE id = $1 AND role = 'teacher'
  `;
  const teacherResult = await pool.query(teacherQuery, [teacherId]);
  
  if (teacherResult.rows.length === 0) {
    throw ApiError.badRequest('Invalid teacher ID or user is not a teacher');
  }

  // Check if assignment already exists
  const existingQuery = `
    SELECT id FROM course_teachers 
    WHERE course_id = $1 AND teacher_id = $2
  `;
  const existingResult = await pool.query(existingQuery, [courseId, teacherId]);
  
  if (existingResult.rows.length > 0) {
    throw ApiError.badRequest('Teacher is already assigned to this course');
  }

  // Create the assignment
  const insertQuery = `
    INSERT INTO course_teachers (course_id, teacher_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  const { rows } = await pool.query(insertQuery, [courseId, teacherId]);
  return rows[0];
}

/**
 * Check if a user is assigned to a course as a teacher
 * @param {string} courseId - Course ID
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<boolean>} Whether the teacher is assigned
 */
async function isTeacherAssignedToCourse(courseId, teacherId) {
  const query = `
    SELECT id FROM course_teachers 
    WHERE course_id = $1 AND teacher_id = $2
  `;
  const { rows } = await pool.query(query, [courseId, teacherId]);
  return rows.length > 0;
}

module.exports = {
  assignTeacherToCourse,
  isTeacherAssignedToCourse
}; 