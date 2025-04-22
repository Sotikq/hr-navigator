const User = require("../models/User");
const jwt = require("jsonwebtoken");

let users = []; // временное хранилище

const register = (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "Пользователь уже существует" });
  }

  const newUser = new User({ name, email, password, role });
  users.push(newUser);

  res.status(201).json({ message: "Пользователь зарегистрирован", id: newUser.id });
};

const login = (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !user.comparePassword(password)) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    "secret123", // перенесём в .env позже
    { expiresIn: "1d" }
  );

  res.json({ message: "Успешный вход", token, role: user.role });
};

module.exports = { register, login };
