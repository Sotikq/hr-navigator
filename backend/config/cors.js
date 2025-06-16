const cors = require('cors');
const logger = require('../utils/logger');

// Define allowed origins
const allowedOrigins = [
  'http://localhost:4200', // Development frontend
  'https://hrnavigator.kz',
  'https://www.hrnavigator.kz',
  'https://server.hrnavigator.kz',
  (process.env.FRONTEND_URL || '').replace(/\/$/, '')
].filter(Boolean); // Remove any undefined values

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
    'Origin',
    'Cache-Control',
    'X-Content-Range'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = cors(corsOptions); 