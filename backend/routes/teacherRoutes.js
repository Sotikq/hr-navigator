const express = require('express');
const router = express.Router();
const { getAssignedCourses } = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const validateApiKey = require('../middleware/apiKeyMiddleware');

/**
 * @swagger
 * /teachers/{teacherId}/courses:
 *   get:
 *     summary: Get all courses assigned to a specific teacher
 *     description: Get all courses assigned to a specific teacher. Only the teacher themselves or an admin can access this data.
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher's user ID
 *     responses:
 *       200:
 *         description: List of courses assigned to the teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   is_published:
 *                     type: boolean
 *       403:
 *         description: Forbidden - Not authorized
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Internal server error
 */
router.get('/teachers/:teacherId/courses',
  authMiddleware,
  validateApiKey(),
  getAssignedCourses
);

module.exports = router; 