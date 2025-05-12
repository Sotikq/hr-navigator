const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', (client) => {
  logger.info('New client connected to pool');
});

pool.on('acquire', (client) => {
  logger.info('Client acquired from pool');
});

pool.on('remove', (client) => {
  logger.info('Client removed from pool');
});

module.exports = pool;
