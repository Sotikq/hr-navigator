const { getCoursesAssignedToTeacher } = require('../models/Course');
const pool = require('../config/db');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

async function getAssignedCourses(req, res, next) {
  const { teacherId } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  try {
    logger.info(`User ${requesterId} (${requesterRole}) requests courses for teacher ${teacherId}`);

    // Check if teacher exists and is a teacher
    const teacherResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [teacherId]);
    if (teacherResult.rows.length === 0 || teacherResult.rows[0].role !== 'teacher') {
      logger.warn(`Teacher not found: ${teacherId}`);
      throw ApiError.notFound('Teacher not found');
    }

    // Only allow if admin or the teacher themselves
    if (requesterRole !== 'admin' && requesterId !== teacherId) {
      logger.warn(`User ${requesterId} not authorized to access courses for teacher ${teacherId}`);
      throw ApiError.forbidden('Not authorized');
    }

    const courses = await getCoursesAssignedToTeacher(teacherId);
    logger.info(`Found ${courses.length} courses for teacher ${teacherId}`);
    res.json(courses);
  } catch (err) {
    logger.error(`Error fetching courses for teacher ${teacherId}:`, err);
    next(err);
  }
}

module.exports = {
  getAssignedCourses
}; 