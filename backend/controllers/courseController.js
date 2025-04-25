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
      is_published = false // значение по умолчанию
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

// ✅ Получение всех опубликованных курсов (для главной страницы)
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

// ✅ Получение курса по ID (например, для страницы-превью)
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

// ✅ Получение всех курсов, созданных авторизованным преподавателем
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

module.exports = {
  createCourse,
  getAllPublishedCourses,
  getCourseById,
  getMyCourses,
};
