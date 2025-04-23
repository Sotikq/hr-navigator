const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateName,
  updatePassword
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Получение профиля текущего пользователя
router.get('/me', authMiddleware, getProfile);

// Обновление имени пользователя
router.patch('/me/name', authMiddleware, updateName);

// Обновление пароля
router.patch('/me/password', authMiddleware, updatePassword);

module.exports = router;
