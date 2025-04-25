const pool = require('../config/db');

// ✅ Добавление нового курса
async function createCourse(req, res) {
  try {
    const {
      title,
      description,
      details,
      price,
      duration,
      cover_url,
      category,
      is_published = false
    } = req.body;

    const authorId = req.user.id;

    const query = `
      INSERT INTO courses (title, description, details, price, duration, cover_url, category, author_id, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      title,
      description,
      details,
      price,
      duration,
      cover_url,
      category,
      authorId,
      is_published
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Ошибка при создании курса:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании курса' });
  }
}

// ✅ Получение всех опубликованных курсов
async function getAllPublishedCourses(req, res) {
  try {
    const query = `SELECT * FROM courses WHERE is_published = true ORDER BY created_at DESC`;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка получения курсов:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении курсов' });
  }
}

// ✅ Получение курса по ID с модулями и уроками
async function getCourseById(req, res) {
  try {
    const courseId = req.params.id;

    const courseQuery = `SELECT * FROM courses WHERE id = $1`;
    const modulesQuery = `SELECT * FROM modules WHERE course_id = $1 ORDER BY position`;
    const lessonsQuery = `SELECT * FROM lessons WHERE module_id = ANY($1::uuid[]) ORDER BY position`;

    const { rows: courseRows } = await pool.query(courseQuery, [courseId]);
    if (courseRows.length === 0) return res.status(404).json({ error: 'Курс не найден' });

    const course = courseRows[0];

    const { rows: moduleRows } = await pool.query(modulesQuery, [courseId]);
    const moduleIds = moduleRows.map((m) => m.id);

    const { rows: lessonRows } = await pool.query(lessonsQuery, [moduleIds]);

    const modulesWithLessons = moduleRows.map((module) => ({
      ...module,
      lessons: lessonRows.filter((lesson) => lesson.module_id === module.id),
    }));

    res.json({ ...course, modules: modulesWithLessons });
  } catch (err) {
    console.error('Ошибка получения курса:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении курса' });
  }
}

// ✅ Получение курсов преподавателя
async function getMyCourses(req, res) {
  try {
    const authorId = req.user.id;
    const query = `SELECT * FROM courses WHERE author_id = $1 ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, [authorId]);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка получения курсов преподавателя:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении курсов' });
  }
}

// 🔹 Добавление модуля к курсу
async function addModuleToCourse(req, res) {
  try {
    const { courseId } = req.params;
    const { title, description, position } = req.body;

    const query = `
      INSERT INTO modules (course_id, title, description, position)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [courseId, title, description, position];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Ошибка добавления модуля:', err);
    res.status(500).json({ error: 'Ошибка сервера при добавлении модуля' });
  }
}

// 🔹 Добавление урока к модулю
async function addLessonToModule(req, res) {
  try {
    const { moduleId } = req.params;
    const { title, description, type, content_url, position } = req.body;

    const query = `
      INSERT INTO lessons (module_id, title, description, type, content_url, position)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [moduleId, title, description, type, content_url, position];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Ошибка добавления урока:', err);
    res.status(500).json({ error: 'Ошибка сервера при добавлении урока' });
  }
}

module.exports = {
  createCourse,
  getAllPublishedCourses,
  getCourseById,
  getMyCourses,
  addModuleToCourse,
  addLessonToModule
};
