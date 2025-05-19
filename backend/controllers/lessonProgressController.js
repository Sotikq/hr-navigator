const LessonProgressModel = require('../models/lessonProgressModel');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class LessonProgressController {
  static async markLessonCompleted(req, res, next) {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id; // From auth middleware

      logger.info('Marking lesson as completed', {
        userId,
        lessonId,
        path: req.path
      });

      const { data, error } = await LessonProgressModel.markLessonCompleted(userId, lessonId);

      if (error) {
        throw new ApiError(500, 'Failed to mark lesson as completed');
      }

      // If we get here, either the lesson was just marked as completed
      // or it was already completed (idempotent behavior)
      return res.status(200).json({
        status: 'success',
        data: {
          lessonId,
          completedAt: data.completed_at
        }
      });
    } catch (error) {
      logger.error('Error in markLessonCompleted controller', {
        error: error.message,
        path: req.path,
        userId: req.user?.id,
        lessonId: req.params.lessonId
      });
      next(error);
    }
  }

  static async getLessonProgress(req, res, next) {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;

      logger.info('Getting lesson progress', {
        userId,
        lessonId,
        path: req.path
      });

      const { data, error } = await LessonProgressModel.getLessonProgress(userId, lessonId);

      if (error) {
        throw new ApiError(500, 'Failed to get lesson progress');
      }

      return res.status(200).json({
        status: 'success',
        data: {
          lessonId,
          completedAt: data?.completed_at || null
        }
      });
    } catch (error) {
      logger.error('Error in getLessonProgress controller', {
        error: error.message,
        path: req.path,
        userId: req.user?.id,
        lessonId: req.params.lessonId
      });
      next(error);
    }
  }

  static async getCourseProgress(req, res, next) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      logger.info('Getting course progress', {
        userId,
        courseId,
        path: req.path
      });

      const { data, error } = await LessonProgressModel.getCourseProgress(userId, courseId);

      if (error) {
        throw new ApiError(500, 'Failed to get course progress');
      }

      return res.status(200).json({
        status: 'success',
        data: {
          courseId: data.courseId,
          totalLessons: data.totalLessons,
          completedLessons: data.completedLessons,
          progress: data.progress,
          lessons: data.lessons
        }
      });
    } catch (error) {
      logger.error('Error in getCourseProgress controller', {
        error: error.message,
        path: req.path,
        userId: req.user?.id,
        courseId: req.params.courseId
      });
      next(error);
    }
  }
}

module.exports = LessonProgressController; 