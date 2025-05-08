const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, findUserById } = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

async function register(req, res, next) {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      throw new ApiError(400, 'Fill in all fields');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new ApiError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, name, role });

    logger.info('New user registered', { userId: user.id, email: user.email });
    res.status(201).json({ message: 'Registration successful', user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      logger.warn('Failed login attempt', { email });
      throw new ApiError(401, 'Invalid password');
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('User logged in', { userId: user.id, email: user.email });
    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile
};

