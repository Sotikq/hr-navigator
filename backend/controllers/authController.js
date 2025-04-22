const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

async function register(req, res) {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Все поля обязательны' });

  const existingUser = await findUserByEmail(email);
  if (existingUser) return res.status(400).json({ error: 'Пользователь уже существует' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ email, passwordHash, role });

  res.status(201).json({ message: 'Регистрация прошла успешно', user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Неверный email или пароль' });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Вход выполнен успешно', token });
}

module.exports = { register, login };
