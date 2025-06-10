const assignmentModel = require('../models/Assignment');
const { findUserById } = require('../models/User');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const fs = require('fs').promises;
const path = require('path');

/**
 * Создание домашнего задания (только для учителей)
 */
async function createAssignment(req, res, next) {
  try {
    const { 
      courseId, 
      lessonId, 
      title, 
      description, 
      instructions, 
      dueDate, 
      maxPoints = 100 
    } = req.body;

    if (!courseId || !title || !description) {
      throw new ApiError(400, 'Course ID, title and description are required');
    }

    // Проверяем права доступа (учитель должен быть автором курса или иметь доступ)
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      throw new ApiError(403, 'Only teachers can create assignments');
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/assignments/files/${req.file.filename}`;
    }

    const assignment = await assignmentModel.createAssignment({
      courseId,
      lessonId,
      title,
      description,
      instructions,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxPoints: parseInt(maxPoints),
      attachmentUrl,
      createdBy: req.user.id
    });

    logger.info('Assignment created', { 
      assignmentId: assignment.id, 
      teacherId: req.user.id,
      courseId 
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение всех заданий по курсу
 */
async function getAssignmentsByCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    
    const assignments = await assignmentModel.getAssignmentsByCourse(courseId);
    
    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение задания по ID
 */
async function getAssignmentById(req, res, next) {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await assignmentModel.getAssignmentById(assignmentId);
    
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }

    res.json({
      success: true,
      data: assignment
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Сдача домашнего задания студентом
 */
async function submitAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;
    const { content } = req.body;
    const studentId = req.user.id;

    if (!content) {
      throw new ApiError(400, 'Assignment content is required');
    }

    // Проверяем что пользователь - студент
    if (req.user.role !== 'user') {
      throw new ApiError(403, 'Only students can submit assignments');
    }

    // Проверяем существование задания
    const assignment = await assignmentModel.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }

    // Проверяем не истек ли срок сдачи
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      throw new ApiError(400, 'Assignment deadline has passed');
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/assignments/submissions/${req.file.filename}`;
    }

    const submission = await assignmentModel.submitAssignment({
      assignmentId,
      studentId,
      content,
      attachmentUrl
    });

    // Отправляем уведомление учителю
    try {
      const teacher = await findUserById(assignment.created_by);
      if (teacher) {
        await emailService.sendEmail(
          teacher.email,
          `Новая сдача задания: ${assignment.title}`,
          `
            <h3>Студент сдал домашнее задание</h3>
            <p><strong>Задание:</strong> ${assignment.title}</p>
            <p><strong>Студент:</strong> ${req.user.name}</p>
            <p><strong>Время сдачи:</strong> ${new Date().toLocaleString('ru-RU')}</p>
            <p><a href="${process.env.BASE_URL}/assignments/${assignmentId}/submissions">Проверить работу</a></p>
          `
        );
      }
    } catch (emailErr) {
      logger.error('Failed to send notification email', emailErr);
    }

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Assignment submitted successfully'
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение всех сдач задания (для учителя)
 */
async function getSubmissionsForAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;

    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      throw new ApiError(403, 'Access denied');
    }

    const submissions = await assignmentModel.getSubmissionsForAssignment(assignmentId);
    
    res.json({
      success: true,
      data: submissions,
      count: submissions.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Получение сдач студента
 */
async function getStudentSubmissions(req, res, next) {
  try {
    const { courseId } = req.query;
    let studentId = req.user.id;

    // Админ и учитель могут смотреть сдачи конкретного студента
    if ((req.user.role === 'admin' || req.user.role === 'teacher') && req.params.studentId) {
      studentId = req.params.studentId;
    }

    const submissions = await assignmentModel.getStudentSubmissions(studentId, courseId);
    
    res.json({
      success: true,
      data: submissions,
      count: submissions.length
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Оценка сдачи задания (для учителя)
 */
async function gradeSubmission(req, res, next) {
  try {
    const { submissionId } = req.params;
    const { points, feedback } = req.body;

    if (points === undefined) {
      throw new ApiError(400, 'Points are required');
    }

    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      throw new ApiError(403, 'Only teachers can grade assignments');
    }

    const gradedSubmission = await assignmentModel.gradeSubmission(
      submissionId, 
      parseInt(points), 
      feedback || null, 
      req.user.id
    );

    if (!gradedSubmission) {
      throw new ApiError(404, 'Submission not found');
    }

    // Отправляем уведомление студенту
    try {
      const student = await findUserById(gradedSubmission.student_id);
      if (student) {
        await emailService.sendEmail(
          student.email,
          'Домашнее задание проверено',
          `
            <h3>Ваше домашнее задание проверено</h3>
            <p><strong>Оценка:</strong> ${points} баллов</p>
            ${feedback ? `<p><strong>Комментарий:</strong> ${feedback}</p>` : ''}
            <p><strong>Проверил:</strong> ${req.user.name}</p>
            <p><a href="${process.env.FRONTEND_URL}assignments">Посмотреть результат</a></p>
          `
        );
      }
    } catch (emailErr) {
      logger.error('Failed to send grade notification email', emailErr);
    }

    res.json({
      success: true,
      data: gradedSubmission,
      message: 'Assignment graded successfully'
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Обновление задания
 */
async function updateAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;
    const fieldsToUpdate = req.body;

    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      throw new ApiError(403, 'Access denied');
    }

    // Обрабатываем новый файл если загружен
    if (req.file) {
      fieldsToUpdate.attachment_url = `/uploads/assignments/files/${req.file.filename}`;
    }

    // Преобразуем дату если передана
    if (fieldsToUpdate.dueDate) {
      fieldsToUpdate.due_date = new Date(fieldsToUpdate.dueDate);
      delete fieldsToUpdate.dueDate;
    }

    const updatedAssignment = await assignmentModel.updateAssignment(assignmentId, fieldsToUpdate);
    
    if (!updatedAssignment) {
      throw new ApiError(404, 'Assignment not found');
    }

    res.json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully'
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Удаление задания
 */
async function deleteAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;

    // Проверяем права доступа
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      throw new ApiError(403, 'Access denied');
    }

    const deletedAssignment = await assignmentModel.deleteAssignment(assignmentId);
    
    if (!deletedAssignment) {
      throw new ApiError(404, 'Assignment not found');
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Статистика по заданиям курса
 */
async function getAssignmentStats(req, res, next) {
  try {
    const { courseId } = req.params;

    const stats = await assignmentModel.getAssignmentStats(courseId);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentById,
  submitAssignment,
  getSubmissionsForAssignment,
  getStudentSubmissions,
  gradeSubmission,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats
}; 