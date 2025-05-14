const pool = require('../config/db');

async function createUser({ email, passwordHash, name, role }) {
  const userRole = role === 'teacher' ? 'teacher' : 'user';

  const query = `
    INSERT INTO users (email, password_hash, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, name, role, is_active, created_at
  `;

  const values = [email, passwordHash, name, userRole];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

async function updateUserName(userId, newName) {
  const { rows } = await pool.query(
    'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role, is_active, created_at',
    [newName, userId]
  );
  return rows[0];
}

async function updateUserPassword(userId, newPasswordHash) {
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
    [newPasswordHash, userId]
  );
  return rows[0];
}

async function getAllTeachers() {
  const query = `
    SELECT id, name, email
    FROM users
    WHERE role = 'teacher'
    ORDER BY name ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getAllTeachersWithCourses() {
  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      COALESCE(
        json_agg(
          json_build_object(
            'id', c.id,
            'title', c.title
          )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) as courses
    FROM users u
    LEFT JOIN course_teachers ct ON u.id = ct.teacher_id
    LEFT JOIN courses c ON ct.course_id = c.id
    WHERE u.role = 'teacher'
    GROUP BY u.id, u.name, u.email
    ORDER BY u.name ASC
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserName,
  updateUserPassword,
  getAllTeachers,
  getAllTeachersWithCourses
};
