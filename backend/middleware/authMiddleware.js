const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  logger.info('authMiddleware: start', { path: req.path, method: req.method });
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.info('authMiddleware: no token, sending 401', { path: req.path });
    return res.status(401).json({ error: 'Нет токена' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // сохраняем данные в req.user
    logger.info('authMiddleware: token valid, calling next()', { path: req.path });
    next();
  } catch (err) {
    logger.info('authMiddleware: invalid token, sending 401', { path: req.path });
    return res.status(401).json({ error: 'Неверный токен' });
  }
}

module.exports = authMiddleware;
