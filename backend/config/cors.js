const cors = require('cors');
const logger = require('../utils/logger');

// Define allowed origins
const allowedOrigins = [
  'http://localhost:4200', // Development frontend
  'http://localhost:5000',
  process.env.FRONTEND_URL, // Production frontend (if set)
].filter(Boolean); // Remove any undefined values

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      return callback(
        new Error('Not allowed by CORS'),
        false
      );
    }

    return callback(null, true);
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

module.exports = cors(corsOptions); 