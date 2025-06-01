const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const {
  createCourse,
  updateCourse,
  getPublishedCourses,
  getUnpublishedCourses,
  getCourseById,
  getCoursesByAuthor,
  addModule,
  updateModule,
  addLesson,
  updateLesson,
  deleteCourse,
  deleteModule,
  deleteLesson,
  addTopic,
  updateTopic,
  deleteTopic
} = require('../models/Course');
const { assignTeacherToCourse, isTeacherAssignedToCourse } = require('../models/CourseTeacher');
const logger = require('../utils/logger');

// ✅ Создание нового курса с загрузкой обложки
async function createCourseHandler(req, res, next) {
  try {
    const {
      title, description, details, price, duration, category, is_published = false
    } = req.body;

    const host = `${req.protocol}://${req.get('host')}`;
    const coverUrl = req.file ? `${host}/uploads/covers/${req.file.filename}` : null;
    const authorId = req.user.id;

    const course = await createCourse({
      title,
      description,
      details,
      price,
      duration,
      coverUrl,
      category,
      authorId,
      is_published
    });

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
}

// ✅ Обновление курса
async function updateCourseHandler(req, res, next) {
  try {
    const courseId = req.params.id;
    const fieldsToUpdate = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Check if course exists
    const course = await getCourseById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    // Check permissions
    if (userRole !== 'admin') {
      // For teachers, check if they're assigned to the course
      if (userRole === 'teacher') {
        const isAssigned = await isTeacherAssignedToCourse(courseId, userId);
        if (!isAssigned) {
          throw ApiError.forbidden('You are not authorized to edit this course');
        }
      } else {
        throw ApiError.forbidden('Only admins and assigned teachers can edit courses');
      }
    }

    if (req.file) {
      const host = `${req.protocol}://${req.get('host')}`;
      fieldsToUpdate.cover_url = `${host}/uploads/covers/${req.file.filename}`;
    }    

    const updatedCourse = await updateCourse(courseId, fieldsToUpdate);
    res.json(updatedCourse);
  } catch (err) {
    next(err);
  }
}

// ✅ Обновление модуля
async function updateModuleHandler(req, res, next) {
  try {
    const moduleId = req.params.id;
    const fieldsToUpdate = req.body;

    const updatedModule = await updateModule(moduleId, fieldsToUpdate);
    if (!updatedModule) {
      throw ApiError.notFound('Module not found or no data to update');
    }

    res.json(updatedModule);
  } catch (err) {
    next(err);
  }
}

// ✅ Обновление урока
async function updateLessonHandler(req, res, next) {
  try {
    const lessonId = req.params.id;
    const fieldsToUpdate = req.body;

    const updatedLesson = await updateLesson(lessonId, fieldsToUpdate);
    if (!updatedLesson) {
      throw ApiError.notFound('Lesson not found or no data to update');
    }

    res.json(updatedLesson);
  } catch (err) {
    next(err);
  }
}

// ✅ Получение всех опубликованных курсов
async function getAllPublishedCourses(req, res, next) {
  try {
    const courses = await getPublishedCourses();
    res.json(courses);
  } catch (err) {
    next(err);
  }
}

// ✅ Получение всех НЕопубликованных курсов вместе с модулями и уроками
async function getAllUnpublishedCourses(req, res, next) {
  try {
    const courseQuery = `SELECT * FROM courses WHERE is_published = false ORDER BY created_at DESC`;
    const { rows: courseRows } = await pool.query(courseQuery);
    if (courseRows.length === 0) return res.json([]);
    
    const courseIds = courseRows.map(course => course.id);
    
    // Get modules
    const { rows: moduleRows } = await pool.query(
      `SELECT * FROM modules WHERE course_id = ANY($1::uuid[]) ORDER BY position`, 
      [courseIds]
    );
    
    const moduleIds = moduleRows.map(m => m.id);
    
    // Get topics
    let topicRows = [];
    if (moduleIds.length > 0) {
      const { rows } = await pool.query(
        `SELECT * FROM topics WHERE module_id = ANY($1::uuid[]) ORDER BY position`, 
        [moduleIds]
      );
      topicRows = rows;
    }
    
    const topicIds = topicRows.map(t => t.id);
    
    // Get lessons
    let lessonRows = [];
    if (topicIds.length > 0) {
      const { rows } = await pool.query(
        `SELECT * FROM lessons WHERE topic_id = ANY($1::uuid[]) ORDER BY position`, 
        [topicIds]
      );
      lessonRows = rows;
    }

    // Build nested structure
    const coursesWithModulesTopicsLessons = courseRows.map(course => {
      const modules = moduleRows
        .filter(m => m.course_id === course.id)
        .map(module => {
          const topics = topicRows
            .filter(topic => topic.module_id === module.id)
            .map(topic => ({
              ...topic,
              lessons: lessonRows.filter(lesson => lesson.topic_id === topic.id)
            }));
          return { ...module, topics };
        });
      return { ...course, modules };
    });

    res.json(coursesWithModulesTopicsLessons);
  } catch (err) { next(err); }
}

// ✅ Получение курса по ID (с модулями и уроками)
async function getCourseByIdHandler(req, res, next) {
  try {
    const courseId = req.params.id;
    const course = await getCourseById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    res.json(course);
  } catch (err) { next(err); }
}

// ✅ Получение всех курсов преподавателя или администратора
async function getMyCourses(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let courses;
    if (userRole === 'admin') {
      // Admins see all courses
      courses = await getCoursesByAuthor(userId);
    } else if (userRole === 'teacher') {
      // Teachers see only assigned courses
      const query = `
        SELECT c.* 
        FROM courses c
        INNER JOIN course_teachers ct ON c.id = ct.course_id
        WHERE ct.teacher_id = $1
        ORDER BY c.created_at DESC
      `;
      const { rows } = await pool.query(query, [userId]);
      courses = rows;
    } else {
      throw ApiError.forbidden('Only teachers and admins can access this endpoint');
    }

    res.json(courses);
  } catch (err) {
    next(err);
  }
}

// ✅ Добавление модуля к курсу
async function addModuleToCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const { title, description, position } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Check if course exists
    const course = await getCourseById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    // Check permissions
    if (userRole !== 'admin') {
      // For teachers, check if they're assigned to the course
      if (userRole === 'teacher') {
        const isAssigned = await isTeacherAssignedToCourse(courseId, userId);
        if (!isAssigned) {
          throw ApiError.forbidden('You are not authorized to add modules to this course');
        }
      } else {
        throw ApiError.forbidden('Only admins and assigned teachers can add modules');
      }
    }

    const newModule = await addModule({ courseId, title, description, position });
    res.status(201).json(newModule);
  } catch (err) {
    next(err);
  }
}

// ✅ Добавление урока к модулю
async function addLessonToModule(req, res, next) {
  try {
    const { moduleId } = req.params;
    const { title, description, type, content_url, position } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // First get the course ID from the module
    const moduleQuery = `
      SELECT m.*, c.id as course_id 
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `;
    const { rows: [module] } = await pool.query(moduleQuery, [moduleId]);
    
    if (!module) {
      throw ApiError.notFound('Module not found');
    }

    // Check permissions
    if (userRole !== 'admin') {
      // For teachers, check if they're assigned to the course
      if (userRole === 'teacher') {
        const isAssigned = await isTeacherAssignedToCourse(module.course_id, userId);
        if (!isAssigned) {
          throw ApiError.forbidden('You are not authorized to add lessons to this module');
        }
      } else {
        throw ApiError.forbidden('Only admins and assigned teachers can add lessons');
      }
    }

    const newLesson = await addLesson({ 
      moduleId, 
      title, 
      description, 
      type, 
      contentUrl: content_url, 
      position 
    });
    res.status(201).json(newLesson);
  } catch (err) {
    next(err);
  }
}

// ✅ Assign teacher to course
async function assignTeacherHandler(req, res, next) {
  try {
    const { id: courseId } = req.params;
    const { teacher_id: teacherId } = req.body;

    if (!teacherId) {
      throw ApiError.badRequest('Teacher ID is required');
    }

    // Check if course exists
    const course = await getCourseById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    const assignment = await assignTeacherToCourse(courseId, teacherId);
    res.status(201).json({
      message: 'Teacher successfully assigned to course',
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function deleteCourseHandler(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const courseId = req.params.id;
    logger.info('Starting course deletion', { courseId });
    
    const course = await getCourseById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found');
    }
    
    await deleteCourse(courseId, client);
    await client.query('COMMIT');
    
    logger.info('Course deleted successfully', { courseId });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Course deletion failed', { courseId: req.params.id, error: err });
    next(err);
  } finally {
    client.release();
  }
}

async function deleteModuleHandler(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const moduleId = req.params.id;
    logger.info('Starting module deletion', { moduleId });
    
    const { rows: [module] } = await client.query('SELECT id FROM modules WHERE id = $1', [moduleId]);
    if (!module) {
      throw ApiError.notFound('Module not found');
    }
    
    await deleteModule(moduleId, client);
    await client.query('COMMIT');
    
    logger.info('Module deleted successfully', { moduleId });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Module deletion failed', { moduleId: req.params.id, error: err });
    next(err);
  } finally {
    client.release();
  }
}

async function deleteLessonHandler(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const lessonId = req.params.id;
    logger.info('Starting lesson deletion', { lessonId });
    
    const { rows: [lesson] } = await client.query('SELECT id FROM lessons WHERE id = $1', [lessonId]);
    if (!lesson) {
      throw ApiError.notFound('Lesson not found');
    }
    
    await deleteLesson(lessonId, client);
    await client.query('COMMIT');
    
    logger.info('Lesson deleted successfully', { lessonId });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Lesson deletion failed', { lessonId: req.params.id, error: err });
    next(err);
  } finally {
    client.release();
  }
}

// ✅ Добавление темы к модулю
async function addTopicToModule(req, res, next) {
  try {
    const { moduleId } = req.params;
    const { title, description, position } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;
    // Проверка существования модуля
    const moduleQuery = `SELECT * FROM modules WHERE id = $1`;
    const { rows: [module] } = await pool.query(moduleQuery, [moduleId]);
    if (!module) throw ApiError.notFound('Module not found');
    // Проверка прав
    if (userRole !== 'admin') {
      if (userRole === 'teacher') {
        const isAssigned = await isTeacherAssignedToCourse(module.course_id, userId);
        if (!isAssigned) throw ApiError.forbidden('You are not authorized to add topics to this module');
      } else {
        throw ApiError.forbidden('Only admins and assigned teachers can add topics');
      }
    }
    const newTopic = await addTopic({ moduleId, title, description, position });
    res.status(201).json(newTopic);
  } catch (err) { next(err); }
}

// ✅ Обновление темы
async function updateTopicHandler(req, res, next) {
  try {
    const topicId = req.params.id;
    const fieldsToUpdate = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;
    // Получаем тему и модуль для проверки прав
    const topicQuery = `SELECT t.*, m.course_id FROM topics t JOIN modules m ON t.module_id = m.id WHERE t.id = $1`;
    const { rows: [topic] } = await pool.query(topicQuery, [topicId]);
    if (!topic) throw ApiError.notFound('Topic not found');
    if (userRole !== 'admin') {
      if (userRole === 'teacher') {
        const isAssigned = await isTeacherAssignedToCourse(topic.course_id, userId);
        if (!isAssigned) throw ApiError.forbidden('You are not authorized to update this topic');
      } else {
        throw ApiError.forbidden('Only admins and assigned teachers can update topics');
      }
    }
    const updatedTopic = await updateTopic(topicId, fieldsToUpdate);
    if (!updatedTopic) throw ApiError.notFound('Topic not found or no data to update');
    res.json(updatedTopic);
  } catch (err) { next(err); }
}

// ✅ Удаление темы
async function deleteTopicHandler(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const topicId = req.params.id;
    const userRole = req.user.role;
    const userId = req.user.id;
    const topicQuery = `SELECT t.*, m.course_id FROM topics t JOIN modules m ON t.module_id = m.id WHERE t.id = $1`;
    const { rows: [topic] } = await client.query(topicQuery, [topicId]);
    if (!topic) throw ApiError.notFound('Topic not found');
    if (userRole !== 'admin') {
      if (userRole === 'teacher') {
        const isAssigned = await isTeacherAssignedToCourse(topic.course_id, userId);
        if (!isAssigned) throw ApiError.forbidden('You are not authorized to delete this topic');
      } else {
        throw ApiError.forbidden('Only admins and assigned teachers can delete topics');
      }
    }
    await deleteTopic(topicId, client);
    await client.query('COMMIT');
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
}

// ✅ Добавление урока к теме
async function addLessonToTopic(req, res, next) {
  try {
    const { topicId } = req.params;
    const { title, description, type, content_url, position } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;
    const topicQuery = `SELECT t.*, m.course_id FROM topics t JOIN modules m ON t.module_id = m.id WHERE t.id = $1`;
    const { rows: [topic] } = await pool.query(topicQuery, [topicId]);
    if (!topic) throw ApiError.notFound('Topic not found');
    if (userRole !== 'admin') {
      if (userRole === 'teacher') {
        const isAssigned = await isTeacherAssignedToCourse(topic.course_id, userId);
        if (!isAssigned) throw ApiError.forbidden('You are not authorized to add lessons to this topic');
      } else {
        throw ApiError.forbidden('Only admins and assigned teachers can add lessons');
      }
    }
    const newLesson = await addLesson({ topicId, title, description, type, contentUrl: content_url, position });
    res.status(201).json(newLesson);
  } catch (err) { next(err); }
}

module.exports = {
  createCourse: createCourseHandler,
  updateCourse: updateCourseHandler,
  updateModule: updateModuleHandler,
  updateLesson: updateLessonHandler,
  getAllPublishedCourses,
  getAllUnpublishedCourses,
  getCourseById: getCourseByIdHandler,
  getMyCourses,
  addModuleToCourse,
  addLessonToModule,
  assignTeacher: assignTeacherHandler,
  deleteCourse: deleteCourseHandler,
  deleteModule: deleteModuleHandler,
  deleteLesson: deleteLessonHandler,
  addTopicToModule,
  updateTopic: updateTopicHandler,
  deleteTopic: deleteTopicHandler,
  addLessonToTopic
};
