const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * Создание домашнего задания
 */
async function createAssignment({ 
  courseId, 
  lessonId, 
  title, 
  description, 
  instructions, 
  dueDate, 
  maxPoints = 100,
  attachmentUrl = null,
  createdBy 
}) {
  const query = `
    INSERT INTO assignments (
      course_id, lesson_id, title, description, instructions, 
      due_date, max_points, attachment_url, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const values = [
    courseId, lessonId, title, description, instructions,
    dueDate, maxPoints, attachmentUrl, createdBy
  ];
  
  const { rows } = await pool.query(query, values);
  logger.info('Assignment created', { assignmentId: rows[0].id, courseId, lessonId });
  return rows[0];
}

/**
 * Получение заданий по курсу
 */
async function getAssignmentsByCourse(courseId) {
  const query = `
    SELECT a.*, 
           l.title as lesson_title,
           u.name as teacher_name,
           COUNT(s.id) as submission_count
    FROM assignments a
    LEFT JOIN lessons l ON a.lesson_id = l.id
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
    WHERE a.course_id = $1
    GROUP BY a.id, l.title, u.name
    ORDER BY a.created_at DESC
  `;
  
  const { rows } = await pool.query(query, [courseId]);
  return rows;
}

/**
 * Получение задания по ID
 */
async function getAssignmentById(assignmentId) {
  const query = `
    SELECT a.*, 
           l.title as lesson_title,
           c.title as course_title,
           u.name as teacher_name
    FROM assignments a
    LEFT JOIN lessons l ON a.lesson_id = l.id
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = $1
  `;
  
  const { rows } = await pool.query(query, [assignmentId]);
  return rows[0];
}

/**
 * Сдача домашнего задания студентом
 */
async function submitAssignment({
  assignmentId,
  studentId,
  content,
  attachmentUrl = null
}) {
  // Проверяем, не сдавал ли уже студент это задание
  const existingQuery = `
    SELECT id FROM assignment_submissions 
    WHERE assignment_id = $1 AND student_id = $2
  `;
  const { rows: existing } = await pool.query(existingQuery, [assignmentId, studentId]);
  
  if (existing.length > 0) {
    // Обновляем существующую сдачу
    const updateQuery = `
      UPDATE assignment_submissions 
      SET content = $3, attachment_url = $4, submitted_at = NOW(), status = 'submitted'
      WHERE assignment_id = $1 AND student_id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(updateQuery, [assignmentId, studentId, content, attachmentUrl]);
    logger.info('Assignment resubmitted', { assignmentId, studentId });
    return rows[0];
  } else {
    // Создаем новую сдачу
    const insertQuery = `
      INSERT INTO assignment_submissions (assignment_id, student_id, content, attachment_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [assignmentId, studentId, content, attachmentUrl]);
    logger.info('Assignment submitted', { assignmentId, studentId });
    return rows[0];
  }
}

/**
 * Получение сдач задания для проверки (для учителя)
 */
async function getSubmissionsForAssignment(assignmentId) {
  const query = `
    SELECT s.*, 
           u.name as student_name,
           u.email as student_email,
           a.title as assignment_title,
           a.max_points
    FROM assignment_submissions s
    LEFT JOIN users u ON s.student_id = u.id
    LEFT JOIN assignments a ON s.assignment_id = a.id
    WHERE s.assignment_id = $1
    ORDER BY s.submitted_at DESC
  `;
  
  const { rows } = await pool.query(query, [assignmentId]);
  return rows;
}

/**
 * Получение сдач студента по курсу
 */
async function getStudentSubmissions(studentId, courseId = null) {
  let query = `
    SELECT s.*, 
           a.title as assignment_title,
           a.max_points,
           a.due_date,
           c.title as course_title,
           l.title as lesson_title
    FROM assignment_submissions s
    LEFT JOIN assignments a ON s.assignment_id = a.id
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN lessons l ON a.lesson_id = l.id
    WHERE s.student_id = $1
  `;
  
  const values = [studentId];
  
  if (courseId) {
    query += ` AND a.course_id = $2`;
    values.push(courseId);
  }
  
  query += ` ORDER BY s.submitted_at DESC`;
  
  const { rows } = await pool.query(query, values);
  return rows;
}

/**
 * Оценка сдачи задания (для учителя)
 */
async function gradeSubmission(submissionId, points, feedback, gradedBy) {
  const query = `
    UPDATE assignment_submissions 
    SET points = $2, feedback = $3, graded_by = $4, graded_at = NOW(), status = 'graded'
    WHERE id = $1
    RETURNING *
  `;
  
  const { rows } = await pool.query(query, [submissionId, points, feedback, gradedBy]);
  logger.info('Assignment graded', { submissionId, points, gradedBy });
  return rows[0];
}

/**
 * Получение статистики по заданиям курса
 */
async function getAssignmentStats(courseId) {
  const query = `
    SELECT 
      COUNT(DISTINCT a.id) as total_assignments,
      COUNT(DISTINCT s.id) as total_submissions,
      COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as graded_submissions,
      ROUND(AVG(s.points), 2) as average_score
    FROM assignments a
    LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
    WHERE a.course_id = $1
  `;
  
  const { rows } = await pool.query(query, [courseId]);
  return rows[0];
}

/**
 * Обновление задания
 */
async function updateAssignment(assignmentId, fieldsToUpdate) {
  const keys = Object.keys(fieldsToUpdate);
  if (keys.length === 0) return null;

  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [assignmentId, ...Object.values(fieldsToUpdate)];

  const query = `
    UPDATE assignments
    SET ${setClause}, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Удаление задания
 */
async function deleteAssignment(assignmentId) {
  const query = `DELETE FROM assignments WHERE id = $1 RETURNING id`;
  const { rows } = await pool.query(query, [assignmentId]);
  logger.info('Assignment deleted', { assignmentId });
  return rows[0];
}

module.exports = {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentById,
  submitAssignment,
  getSubmissionsForAssignment,
  getStudentSubmissions,
  gradeSubmission,
  getAssignmentStats,
  updateAssignment,
  deleteAssignment
}; 