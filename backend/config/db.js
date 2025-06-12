const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
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
