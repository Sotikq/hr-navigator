const pool = require('../config/db');
const { createCourse, getPublishedCourses, getUnpublishedCourses, getCourseById, getCoursesByAuthor, addModule, addLesson } = require('../models/Course');

// ✅ Создание нового курса
async function createCourseHandler(req, res) {
  try {
    const {
      title, description, details, price, duration, cover_url, category, is_published = false
    } = req.body;

    const authorId = req.user.id;

    const course = await createCourse({
      title,
      description,
      details,
      price,
      duration,
      coverUrl: cover_url,
      category,
      authorId,
      is_published
    });

    res.status(201).json(course);
  } catch (err) {
    console.error('Ошибка при создании курса:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании курса' });
  }
}

// ✅ Получение всех опубликованных курсов
async function getAllPublishedCourses(req, res) {
  try {
    const courses = await getPublishedCourses();
    res.json(courses);
  } catch (err) {
    console.error('Ошибка получения курсов:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении курсов' });
  }
}

// ✅ Получение всех НЕопубликованных курсов вместе с модулями и уроками
async function getAllUnpublishedCourses(req, res) {
  try {
    // 1. Сначала получаем все неопубликованные курсы
    const courseQuery = `SELECT * FROM courses WHERE is_published = false ORDER BY created_at DESC`;
    const { rows: courseRows } = await pool.query(courseQuery);

    if (courseRows.length === 0) {
      return res.json([]); // нет курсов — возвращаем пустой массив
    }

    const courseIds = courseRows.map(course => course.id);

    // 2. Получаем все модули, относящиеся к этим курсам
    const moduleQuery = `
      SELECT * FROM modules
      WHERE course_id = ANY($1::uuid[])
      ORDER BY position
    `;
    const { rows: moduleRows } = await pool.query(moduleQuery, [courseIds]);

    const moduleIds = moduleRows.map(module => module.id);

    // 3. Получаем все уроки для этих модулей
    let lessonRows = [];
    if (moduleIds.length > 0) {
      const lessonQuery = `
        SELECT * FROM lessons
        WHERE module_id = ANY($1::uuid[])
        ORDER BY position
      `;
      const { rows } = await pool.query(lessonQuery, [moduleIds]);
      lessonRows = rows;
    }

    // 4. Структурируем ответ: курсы -> модули -> уроки
    const coursesWithModulesAndLessons = courseRows.map(course => {
      const modules = moduleRows
        .filter(m => m.course_id === course.id)
        .map(module => ({
          ...module,
          lessons: lessonRows.filter(lesson => lesson.module_id === module.id)
        }));

      return {
        ...course,
        modules
      };
    });

    res.json(coursesWithModulesAndLessons);

  } catch (err) {
    console.error('Ошибка получения неопубликованных курсов:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении курсов' });
  }
}

// ✅ Получение курса по ID (с модулями и уроками)
async function getCourseByIdHandler(req, res) {
  try {
    const courseId = req.params.id;

    const course = await getCourseById(courseId);
    if (!course) return res.status(404).json({ error: 'Курс не найден' });

    const moduleQuery = `SELECT * FROM modules WHERE course_id = $1 ORDER BY position`;
    const { rows: moduleRows } = await pool.query(moduleQuery, [courseId]);

    const moduleIds = moduleRows.map((m) => m.id);

    let lessonRows = [];
    if (moduleIds.length > 0) {
      const lessonQuery = `SELECT * FROM lessons WHERE module_id = ANY($1::uuid[]) ORDER BY position`;
      const result = await pool.query(lessonQuery, [moduleIds]);
      lessonRows = result.rows;
    }

    const modulesWithLessons = moduleRows.map((module) => ({
      ...module,
      lessons: lessonRows.filter((lesson) => lesson.module_id === module.id)
    }));

    res.json({ ...course, modules: modulesWithLessons });
  } catch (err) {
    console.error('Ошибка получения курса:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении курса' });
  }
}

// ✅ Получение всех курсов преподавателя
async function getMyCourses(req, res) {
  try {
    const authorId = req.user.id;
    const courses = await getCoursesByAuthor(authorId);
    res.json(courses);
  } catch (err) {
    console.error('Ошибка получения курсов преподавателя:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении курсов преподавателя' });
  }
}

// ✅ Добавление модуля к курсу
async function addModuleToCourse(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, position } = req.body;

    const newModule = await addModule({ courseId, title, description, position });
    res.status(201).json(newModule);
  } catch (err) {
    console.error('Ошибка добавления модуля:', err);
    res.status(500).json({ error: 'Ошибка сервера при добавлении модуля' });
  }
}

// ✅ Добавление урока к модулю
async function addLessonToModule(req, res) {
  try {
    const { moduleId } = req.params;
    const { title, description, type, content_url, position } = req.body;

    const newLesson = await addLesson({ moduleId, title, description, type, contentUrl: content_url, position });
    res.status(201).json(newLesson);
  } catch (err) {
    console.error('Ошибка добавления урока:', err);
    res.status(500).json({ error: 'Ошибка сервера при добавлении урока' });
  }
}

module.exports = {
  createCourse: createCourseHandler,
  getAllPublishedCourses,
  getAllUnpublishedCourses,
  getCourseById: getCourseByIdHandler,
  getMyCourses,
  addModuleToCourse,
  addLessonToModule
};
