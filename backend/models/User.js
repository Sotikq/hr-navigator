const pool = require('../config/db');

async function createUser({ email, passwordHash, role }) {
  const result = await pool.query(
    `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *`,
    [email, passwordHash, role]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0];
}

module.exports = { createUser, findUserByEmail };
