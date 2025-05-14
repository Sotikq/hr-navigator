const express = require('express');
const router = express.Router();
const { getProfile, updateName, updatePassword, getAllTeachersList, getTeachersWithCourses, unassignCourseFromTeacher } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const validateApiKey = require('../middleware/apiKeyMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Получение профиля текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 */
router.get('/me', authMiddleware, getProfile);

/**
 * @swagger
 * /auth/me/name:
 *   patch:
 *     summary: Обновление имени пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Имя обновлено
 */
router.patch('/me/name', authMiddleware, updateName);

/**
 * @swagger
 * /auth/me/password:
 *   patch:
 *     summary: Обновление пароля пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пароль обновлен
 */
router.patch('/me/password', authMiddleware, updatePassword);

/**
 * @swagger
 * /auth/teachers:
 *   get:
 *     summary: Get all teachers (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *       403:
 *         description: Forbidden - Only administrators can access this endpoint
 */
router.get('/teachers', authMiddleware, checkRole(['admin']), getAllTeachersList);

/**
 * @swagger
 * /auth/admin/teachers-with-courses:
 *   get:
 *     summary: Get all teachers with their assigned courses (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of teachers with their courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Teacher's user ID
 *                   name:
 *                     type: string
 *                     description: Teacher's full name
 *                   email:
 *                     type: string
 *                     description: Teacher's email address
 *                   courses:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Course ID
 *                         title:
 *                           type: string
 *                           description: Course title
 *       403:
 *         description: Forbidden - Only administrators can access this endpoint
 *       500:
 *         description: Internal server error
 */
router.get('/admin/teachers-with-courses',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey(),
  getTeachersWithCourses
);

/**
 * @swagger
 * /auth/admin/teachers/{teacherId}/courses/{courseId}:
 *   delete:
 *     summary: Unassign a course from a teacher (admin only)
 *     tags: [Users]
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
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course unassigned from teacher successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course unassigned from teacher successfully
 *       404:
 *         description: Assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Assignment not found
 *       403:
 *         description: Forbidden - Only administrators can access this endpoint
 *       500:
 *         description: Internal server error
 */
router.delete('/admin/teachers/:teacherId/courses/:courseId',
  authMiddleware,
  checkRole(['admin']),
  validateApiKey(),
  unassignCourseFromTeacher
);

module.exports = router;
