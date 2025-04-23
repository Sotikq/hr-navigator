const pool = require('../config/db');

async function createUser({ email, passwordHash, name, role }) {
  // Если явно указана роль teacher — сохраняем её, иначе назначаем user
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

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
