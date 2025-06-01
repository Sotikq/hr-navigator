const pool = require('../config/db');
const logger = require('../utils/logger');

class LessonProgressModel {
  static async markLessonCompleted(userId, lessonId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First check if the lesson is already completed
      const checkQuery = `
        SELECT completed_at 
        FROM lesson_progress 
        WHERE user_id = $1 AND lesson_id = $2
      `;
      const { rows: [existingProgress] } = await client.query(checkQuery, [userId, lessonId]);

      // If lesson is already completed, return the existing record
      if (existingProgress) {
        await client.query('COMMIT');
        return { data: existingProgress, error: null };
      }

      // If not completed, insert new record
      const insertQuery = `
        INSERT INTO lesson_progress (user_id, lesson_id, completed_at)
        VALUES ($1, $2, NOW())
        RETURNING *
      `;
      const { rows: [newProgress] } = await client.query(insertQuery, [userId, lessonId]);

      await client.query('COMMIT');
      return { data: newProgress, error: null };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error marking lesson as completed', {
        userId,
        lessonId,
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  static async getLessonProgress(userId, lessonId) {
    try {
      const query = `
        SELECT completed_at 
        FROM lesson_progress 
        WHERE user_id = $1 AND lesson_id = $2
      `;
      const { rows: [progress] } = await pool.query(query, [userId, lessonId]);
      return { data: progress, error: null };
    } catch (error) {
      logger.error('Error getting lesson progress', {
        userId,
        lessonId,
        error: error.message
      });
      throw error;
    }
  }

  static async getCourseProgress(userId, courseId) {
    try {
      // Get all lessons with their completion status
      const lessonsQuery = `
        SELECT l.id as lesson_id, lp.completed_at
        FROM lessons l
        JOIN topics t ON l.topic_id = t.id
        JOIN modules m ON t.module_id = m.id
        LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = $1
        WHERE m.course_id = $2
        ORDER BY m.position, t.position, l.position
      `;
      const { rows: lessons } = await pool.query(lessonsQuery, [userId, courseId]);

      // Get total lessons count
      const totalQuery = `
        SELECT COUNT(l.id) as total_lessons
        FROM lessons l
        JOIN topics t ON l.topic_id = t.id
        JOIN modules m ON t.module_id = m.id
        WHERE m.course_id = $1
      `;
      const { rows: [{ total_lessons }] } = await pool.query(totalQuery, [courseId]);

      // Calculate completed lessons
      const completedLessons = lessons.filter(lesson => lesson.completed_at !== null).length;

      // Calculate progress percentage
      const progress = total_lessons > 0 
        ? Math.round((completedLessons / total_lessons) * 100)
        : 0;

      logger.info('Course progress calculated', {
        userId,
        courseId,
        totalLessons: total_lessons,
        completedLessons,
        progress
      });

      return {
        data: {
          courseId,
          totalLessons: parseInt(total_lessons),
          completedLessons,
          progress,
          lessons
        },
        error: null
      };
    } catch (error) {
      logger.error('Error getting course progress', {
        userId,
        courseId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = LessonProgressModel; 