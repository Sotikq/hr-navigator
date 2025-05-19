const express = require('express');
const router = express.Router();
const LessonProgressController = require('../controllers/lessonProgressController');
const authMiddleware = require('../middleware/authMiddleware');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Apply API key middleware if it's used in the project
if (process.env.REQUIRE_API_KEY === 'true') {
  router.use(apiKeyMiddleware);
}

/**
 * @swagger
 * /progress/lesson/{lessonId}:
 *   post:
 *     tags: [Progress]
 *     summary: Mark a lesson as completed
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the lesson to mark as completed
 *     responses:
 *       200:
 *         description: Lesson marked as completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessonId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-03-20T15:30:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.post('/lesson/:lessonId', LessonProgressController.markLessonCompleted);

/**
 * @swagger
 * /progress/lesson/{lessonId}:
 *   get:
 *     tags: [Progress]
 *     summary: Get progress for a specific lesson
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the lesson to get progress for
 *     responses:
 *       200:
 *         description: Lesson progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     lessonId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2024-03-20T15:30:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.get('/lesson/:lessonId', LessonProgressController.getLessonProgress);

/**
 * @swagger
 * /progress/course/{courseId}:
 *   get:
 *     tags: [Progress]
 *     summary: Get progress for all lessons in a course
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the course to get progress for
 *     responses:
 *       200:
 *         description: Course progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     courseId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     totalLessons:
 *                       type: integer
 *                       description: Total number of lessons in the course
 *                       example: 10
 *                     completedLessons:
 *                       type: integer
 *                       description: Number of lessons completed by the user
 *                       example: 8
 *                     progress:
 *                       type: integer
 *                       description: Percentage of course completion (0-100)
 *                       example: 80
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lesson_id:
 *                             type: string
 *                             format: uuid
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           completed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2024-03-20T15:30:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.get('/course/:courseId', LessonProgressController.getCourseProgress);

module.exports = router; 