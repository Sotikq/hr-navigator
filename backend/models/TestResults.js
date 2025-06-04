const pool = require('../config/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Создание результата теста
 */
async function createTestResult({
  userId,
  courseId,
  formUrl,
  part,
  score,
  maxScore,
  details,
  submittedAt = new Date()
}) {
  const query = `
    INSERT INTO test_results (id, user_id, course_id, form_url, part, score, max_score, details, submitted_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const values = [
    uuidv4(),
    userId,
    courseId,
    formUrl,
    part,
    score,
    maxScore,
    JSON.stringify(details),
    submittedAt
  ];
  
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Получение результатов тестов пользователя
 */
async function getUserTestResults(userId, courseId = null) {
  let query = `
    SELECT tr.*, c.title as course_title
    FROM test_results tr
    JOIN courses c ON tr.course_id = c.id
    WHERE tr.user_id = $1
  `;
  const values = [userId];

  if (courseId) {
    query += ' AND tr.course_id = $2';
    values.push(courseId);
  }

  query += ' ORDER BY tr.submitted_at DESC';

  const { rows } = await pool.query(query, values);
  return rows.map(row => ({
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
  }));
}

/**
 * Получение всех результатов тестов по курсу (для админа)
 */
async function getCourseTestResults(courseId) {
  const query = `
    SELECT 
      tr.*,
      u.email,
      u.name as user_name,
      c.title as course_title
    FROM test_results tr
    JOIN users u ON tr.user_id = u.id
    JOIN courses c ON tr.course_id = c.id
    WHERE tr.course_id = $1
    ORDER BY tr.submitted_at DESC
  `;
  
  const { rows } = await pool.query(query, [courseId]);
  return rows.map(row => ({
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
  }));
}

/**
 * Получение статистики по результатам тестов курса
 */
async function getCourseTestStatistics(courseId) {
  const query = `
    SELECT 
      part,
      COUNT(*) as total_attempts,
      COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as completed_attempts,
      AVG(CASE WHEN score IS NOT NULL THEN score END) as average_score,
      MAX(max_score) as max_possible_score,
      MIN(CASE WHEN score IS NOT NULL THEN score END) as min_score,
      MAX(CASE WHEN score IS NOT NULL THEN score END) as max_score
    FROM test_results 
    WHERE course_id = $1
    GROUP BY part
    ORDER BY part
  `;
  
  const { rows } = await pool.query(query, [courseId]);
  return rows.map(row => ({
    ...row,
    average_score: row.average_score ? parseFloat(row.average_score).toFixed(2) : null,
    completion_rate: row.total_attempts > 0 
      ? parseFloat((row.completed_attempts / row.total_attempts * 100).toFixed(2))
      : 0
  }));
}

/**
 * Получение результата конкретного пользователя по курсу и части
 */
async function getUserTestResult(userId, courseId, part) {
  const query = `
    SELECT tr.*, c.title as course_title
    FROM test_results tr
    JOIN courses c ON tr.course_id = c.id
    WHERE tr.user_id = $1 AND tr.course_id = $2 AND tr.part = $3
  `;
  
  const { rows } = await pool.query(query, [userId, courseId, part]);
  if (rows.length === 0) return null;
  
  const result = rows[0];
  return {
    ...result,
    details: typeof result.details === 'string' ? JSON.parse(result.details) : result.details
  };
}

/**
 * Обновление результата теста
 */
async function updateTestResult(userId, courseId, part, updates) {
  const allowedFields = ['score', 'max_score', 'details', 'submitted_at'];
  const updateFields = Object.keys(updates).filter(field => allowedFields.includes(field));
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  const setClause = updateFields.map((field, index) => {
    if (field === 'details') {
      return `${field} = $${index + 4}::jsonb`;
    }
    return `${field} = $${index + 4}`;
  }).join(', ');

  const values = [
    userId,
    courseId,
    part,
    ...updateFields.map(field => 
      field === 'details' ? JSON.stringify(updates[field]) : updates[field]
    )
  ];

  const query = `
    UPDATE test_results
    SET ${setClause}
    WHERE user_id = $1 AND course_id = $2 AND part = $3
    RETURNING *
  `;

  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Удаление результата теста
 */
async function deleteTestResult(userId, courseId, part) {
  const query = `
    DELETE FROM test_results
    WHERE user_id = $1 AND course_id = $2 AND part = $3
    RETURNING *
  `;
  
  const { rows } = await pool.query(query, [userId, courseId, part]);
  return rows[0];
}

/**
 * Проверка прохождения пользователем всех частей теста курса
 */
async function getUserCourseTestStatus(userId, courseId) {
  const query = `
    SELECT 
      part,
      score,
      max_score,
      submitted_at,
      CASE 
        WHEN score IS NOT NULL AND max_score IS NOT NULL 
        THEN ROUND((score::decimal / max_score::decimal) * 100, 2)
        ELSE NULL 
      END as percentage
    FROM test_results
    WHERE user_id = $1 AND course_id = $2
    ORDER BY part
  `;
  
  const { rows } = await pool.query(query, [userId, courseId]);
  
  // Динамически определяем общее количество частей на основе существующих данных
  const totalParts = rows.length > 0 ? Math.max(...rows.map(r => r.part)) : 0;
  const completedParts = rows.filter(r => r.score !== null).length;
  const totalScore = rows.reduce((sum, r) => sum + (r.score || 0), 0);
  const totalMaxScore = rows.reduce((sum, r) => sum + (r.max_score || 0), 0);
  
  return {
    parts: rows,
    completed_parts: completedParts,
    total_parts: totalParts,
    total_score: totalScore,
    total_max_score: totalMaxScore,
    overall_percentage: totalMaxScore > 0 ? parseFloat((totalScore / totalMaxScore * 100).toFixed(2)) : 0,
    is_completed: completedParts === totalParts && totalParts > 0,
    passed: totalMaxScore > 0 && (totalScore / totalMaxScore) >= 0.6 // 60% для прохождения
  };
}

/**
 * Получение списка пользователей, готовых к получению сертификата
 */
async function getUsersReadyForCertificate(courseId, passingScore = 60) {
  // Динамически определяем количество частей теста для данного курса
  const partsQuery = `
    SELECT DISTINCT part 
    FROM test_results 
    WHERE course_id = $1 
    ORDER BY part
  `;
  const { rows: partsRows } = await pool.query(partsQuery, [courseId]);
  const requiredParts = partsRows.length;
  
  if (requiredParts === 0) {
    return []; // Нет результатов тестов для этого курса
  }
  
  const query = `
    SELECT 
      u.id,
      u.email,
      u.name,
      SUM(tr.score) as total_score,
      SUM(tr.max_score) as total_max_score,
      COUNT(tr.part) as completed_parts,
      ROUND((SUM(tr.score)::decimal / SUM(tr.max_score)::decimal) * 100, 2) as percentage
    FROM users u
    JOIN test_results tr ON u.id = tr.user_id
    WHERE tr.course_id = $1 AND tr.score IS NOT NULL
    GROUP BY u.id, u.email, u.name
    HAVING 
      COUNT(tr.part) = $2 
      AND ROUND((SUM(tr.score)::decimal / SUM(tr.max_score)::decimal) * 100, 2) >= $3
    ORDER BY percentage DESC
  `;
  
  const { rows } = await pool.query(query, [courseId, requiredParts, passingScore]);
  return rows;
}

module.exports = {
  createTestResult,
  getUserTestResults,
  getCourseTestResults,
  getCourseTestStatistics,
  getUserTestResult,
  updateTestResult,
  deleteTestResult,
  getUserCourseTestStatus,
  getUsersReadyForCertificate
}; 