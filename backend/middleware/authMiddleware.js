const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Проверка наличия заголовка авторизации
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Нет токена. Доступ запрещён" });
  }

  // Получаем токен
  const token = authHeader.split(" ")[1];

  try {
    // Проверка токена и расшифровка
    const decoded = jwt.verify(token, "secret123"); // позже вынесем в .env
    req.user = decoded; // { id, role }
    next(); // всё хорошо, идём дальше
  } catch (err) {
    res.status(401).json({ error: "Неверный токен" });
  }
};

module.exports = authMiddleware;
