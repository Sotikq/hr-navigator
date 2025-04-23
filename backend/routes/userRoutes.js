const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Получение профиля текущего пользователя
router.get('/me', authMiddleware, getProfile);

module.exports = router;
