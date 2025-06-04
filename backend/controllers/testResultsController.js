const {
  getUserTestResults,
  getCourseTestResults,
  getCourseTestStatistics,
  getUserTestResult,
  getUserCourseTestStatus,
  getUsersReadyForCertificate
} = require('../models/TestResults');
const { importTestResultsFromSheet, getSheetInfo } = require('../services/googleSheetsImport');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Получение результатов тестов текущего пользователя
 */
async function getMyTestResults(req, res, next) {
  try {
    const userId = req.user.id;
    const { courseId } = req.query;

    const results = await getUserTestResults(userId, courseId);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error getting user test results', { userId: req.user.id, error });
    next(error);
  }
}

/**
 * Получение статуса прохождения тестов по курсу для текущего пользователя
 */
async function getMyCourseTestStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    const status = await getUserCourseTestStatus(userId, courseId);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting user course test status', { userId: req.user.id, courseId: req.params.courseId, error });
    next(error);
  }
}

/**
 * Получение результатов тестов по курсу (только для админов)
 */
async function getCourseResults(req, res, next) {
  try {
    const { courseId } = req.params;

    const results = await getCourseTestResults(courseId);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error getting course test results', { courseId: req.params.courseId, error });
    next(error);
  }
}

/**
 * Получение статистики по курсу (только для админов)
 */
async function getCourseStatistics(req, res, next) {
  try {
    const { courseId } = req.params;

    const statistics = await getCourseTestStatistics(courseId);
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting course test statistics', { courseId: req.params.courseId, error });
    next(error);
  }
}

/**
 * Получение пользователей, готовых к получению сертификата
 */
async function getUsersReadyForCertificateHandler(req, res, next) {
  try {
    const { courseId } = req.params;
    const { passingScore = 60 } = req.query;

    const users = await getUsersReadyForCertificate(courseId, parseFloat(passingScore));
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error getting users ready for certificate', { courseId: req.params.courseId, error });
    next(error);
  }
}

/**
 * Импорт результатов из Google Sheets (только для админов)
 */
async function importFromGoogleSheets(req, res, next) {
  try {
    const {
      sheetId,
      courseId,
      part,
      range = 'A1:Z1000'
    } = req.body;

    // Валидация входных данных
    if (!sheetId || !courseId || !part) {
      throw ApiError.badRequest('sheetId, courseId and part are required');
    }

    // Убираем жесткое ограничение на части 1 и 2
    if (!Number.isInteger(parseInt(part)) || parseInt(part) <= 0) {
      throw ApiError.badRequest('part must be a positive integer');
    }

    logger.info('Starting import from Google Sheets', {
      sheetId,
      courseId,
      part,
      requestedBy: req.user.id
    });

    const result = await importTestResultsFromSheet(
      sheetId,
      courseId,
      parseInt(part),
      range
    );

    res.json({
      success: true,
      message: 'Import completed',
      data: result
    });
  } catch (error) {
    logger.error('Error importing from Google Sheets', {
      body: req.body,
      requestedBy: req.user.id,
      error
    });
    next(error);
  }
}

/**
 * Получение информации о Google Sheet (метаданные)
 */
async function getGoogleSheetInfo(req, res, next) {
  try {
    const { sheetId } = req.params;

    if (!sheetId) {
      throw ApiError.badRequest('sheetId is required');
    }

    const info = await getSheetInfo(sheetId);
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    logger.error('Error getting Google Sheet info', { sheetId: req.params.sheetId, error });
    next(error);
  }
}

/**
 * Получение конкретного результата пользователя
 */
async function getUserTestResultHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { courseId, part } = req.params;

    // Убираем жесткое ограничение на части 1 и 2
    if (!Number.isInteger(parseInt(part)) || parseInt(part) <= 0) {
      throw ApiError.badRequest('part must be a positive integer');
    }

    const result = await getUserTestResult(userId, courseId, parseInt(part));
    
    if (!result) {
      return res.json({
        success: true,
        data: null,
        message: 'Test result not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting user test result', {
      userId: req.user.id,
      courseId: req.params.courseId,
      part: req.params.part,
      error
    });
    next(error);
  }
}

/**
 * Получение всех результатов тестов (только для админов)
 */
async function getAllTestResults(req, res, next) {
  try {
    const { page = 1, limit = 50, courseId, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        tr.*,
        u.email,
        u.name as user_name,
        c.title as course_title
      FROM test_results tr
      JOIN users u ON tr.user_id = u.id
      JOIN courses c ON tr.course_id = c.id
    `;
    const conditions = [];
    const values = [];

    if (courseId) {
      conditions.push(`tr.course_id = $${values.length + 1}`);
      values.push(courseId);
    }

    if (userId) {
      conditions.push(`tr.user_id = $${values.length + 1}`);
      values.push(userId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY tr.submitted_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(parseInt(limit), offset);

    const pool = require('../config/db');
    const { rows } = await pool.query(query, values);

    // Подсчитываем общее количество записей
    let countQuery = `
      SELECT COUNT(*)
      FROM test_results tr
      JOIN users u ON tr.user_id = u.id
      JOIN courses c ON tr.course_id = c.id
    `;
    
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    const { rows: countRows } = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countRows[0].count);

    const results = rows.map(row => ({
      ...row,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
    }));

    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting all test results', { query: req.query, error });
    next(error);
  }
}

module.exports = {
  getMyTestResults,
  getMyCourseTestStatus,
  getCourseResults,
  getCourseStatistics,
  getUsersReadyForCertificateHandler,
  importFromGoogleSheets,
  getGoogleSheetInfo,
  getUserTestResultHandler,
  getAllTestResults
}; 