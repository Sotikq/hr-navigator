const pool = require('../config/db');

async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, email, name, role, is_active, created_at
      FROM users
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = {
  getProfile,
};
