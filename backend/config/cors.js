const cors = require('cors');
const logger = require('../utils/logger');

// Define allowed origins
const allowedOrigins = [
  'http://localhost:4200', // Development frontend
  'http://localhost:5000',
  'https://hr-navigator.netlify.app', // Netlify production
  (process.env.FRONTEND_URL || '').replace(/\/$/, ''), // Production frontend (if set, без слэша на конце)
].filter(Boolean); // Remove any undefined values

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-api-key',
    'X-API-Key', // Case-insensitive support
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = cors(corsOptions); 