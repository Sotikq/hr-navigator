const pool = require('../config/db');
const bcrypt = require('bcrypt');
const {
  updateUserName,
  updateUserPassword,
  findUserById,
  getAllTeachers
} = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

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

async function updateName(req, res) {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Имя не может быть пустым' });
    }

    const updatedUser = await updateUserName(userId, name);
    res.json({ message: 'Имя обновлено', user: updatedUser });
  } catch (err) {
    console.error('Ошибка обновления имени:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }

    const user = await findUserById(userId);
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Старый пароль неверный' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(userId, newPasswordHash);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('Ошибка смены пароля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function getAllTeachersList(req, res, next) {
  try {
    const teachers = await getAllTeachers();
    res.json(teachers);
  } catch (err) {
    logger.error('Error fetching teachers:', err);
    next(new ApiError(500, 'Failed to fetch teachers'));
  }
}

module.exports = {
  getProfile,
  updateName,
  updatePassword,
  getAllTeachersList
};
