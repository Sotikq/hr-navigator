const cron = require('node-cron');
const pool = require('../config/db');
const { importTestResultsFromSheet } = require('./googleSheetsImport');
const logger = require('../utils/logger');

/**
 * Таблица для хранения настроек автоматического импорта
 * 
 * CREATE TABLE IF NOT EXISTS test_import_schedules (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   course_id uuid NOT NULL REFERENCES courses(id),
 *   part integer NOT NULL CHECK (part > 0),
 *   sheet_id text NOT NULL,
 *   schedule_cron text NOT NULL,
 *   is_active boolean DEFAULT true,
 *   last_import_at timestamp with time zone,
 *   created_at timestamp with time zone DEFAULT now(),
 *   UNIQUE(course_id, part)
 * );
 */

class TestImportScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Инициализация планировщика - загрузка расписаний из БД
   */
  async initialize() {
    try {
      logger.info('Initializing Test Import Scheduler...');
      
      // Загружаем все активные расписания из БД
      const { rows: schedules } = await pool.query(`
        SELECT tis.*, c.title as course_title
        FROM test_import_schedules tis
        JOIN courses c ON tis.course_id = c.id
        WHERE tis.is_active = true
      `);

      // Запускаем cron jobs для каждого расписания
      for (const schedule of schedules) {
        await this.scheduleImport(schedule);
      }

      this.isInitialized = true;
      logger.info(`Test Import Scheduler initialized with ${schedules.length} active schedules`);

    } catch (error) {
      logger.error('Error initializing Test Import Scheduler', { error });
      throw error;
    }
  }

  /**
   * Добавление нового расписания импорта
   */
  async addSchedule(courseId, part, sheetId, cronSchedule) {
    try {
      // Валидация cron expression
      if (!cron.validate(cronSchedule)) {
        throw new Error('Invalid cron schedule format');
      }

      // Валидация части теста
      if (!Number.isInteger(part) || part <= 0) {
        throw new Error('Part must be a positive integer');
      }

      // Вставляем в БД
      const { rows } = await pool.query(`
        INSERT INTO test_import_schedules (course_id, part, sheet_id, schedule_cron)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (course_id, part)
        DO UPDATE SET 
          sheet_id = EXCLUDED.sheet_id,
          schedule_cron = EXCLUDED.schedule_cron,
          is_active = true
        RETURNING *
      `, [courseId, part, sheetId, cronSchedule]);

      const schedule = rows[0];

      // Запускаем cron job
      await this.scheduleImport(schedule);

      logger.info('Import schedule added', { 
        courseId, 
        part, 
        sheetId, 
        cronSchedule 
      });

      return schedule;

    } catch (error) {
      logger.error('Error adding import schedule', { 
        courseId, 
        part, 
        sheetId, 
        cronSchedule, 
        error 
      });
      throw error;
    }
  }

  /**
   * Удаление расписания импорта
   */
  async removeSchedule(courseId, part) {
    try {
      // Останавливаем cron job
      const jobKey = `${courseId}_${part}`;
      if (this.scheduledJobs.has(jobKey)) {
        this.scheduledJobs.get(jobKey).destroy();
        this.scheduledJobs.delete(jobKey);
      }

      // Удаляем из БД
      await pool.query(`
        UPDATE test_import_schedules 
        SET is_active = false 
        WHERE course_id = $1 AND part = $2
      `, [courseId, part]);

      logger.info('Import schedule removed', { courseId, part });

    } catch (error) {
      logger.error('Error removing import schedule', { courseId, part, error });
      throw error;
    }
  }

  /**
   * Запуск cron job для конкретного расписания
   */
  async scheduleImport(schedule) {
    const jobKey = `${schedule.course_id}_${schedule.part}`;

    // Если job уже существует, останавливаем его
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).destroy();
    }

    // Создаем новый cron job
    const job = cron.schedule(schedule.schedule_cron, async () => {
      try {
        logger.info('Starting scheduled import', {
          courseId: schedule.course_id,
          part: schedule.part,
          sheetId: schedule.sheet_id
        });

        const result = await importTestResultsFromSheet(
          schedule.sheet_id,
          schedule.course_id,
          schedule.part
        );

        // Обновляем время последнего импорта
        await pool.query(`
          UPDATE test_import_schedules 
          SET last_import_at = NOW() 
          WHERE course_id = $1 AND part = $2
        `, [schedule.course_id, schedule.part]);

        logger.info('Scheduled import completed', {
          courseId: schedule.course_id,
          part: schedule.part,
          result
        });

      } catch (error) {
        logger.error('Scheduled import failed', {
          courseId: schedule.course_id,
          part: schedule.part,
          sheetId: schedule.sheet_id,
          error
        });
      }
    }, {
      scheduled: false // Запускаем вручную
    });

    // Сохраняем job в мапе
    this.scheduledJobs.set(jobKey, job);

    // Запускаем job
    job.start();

    logger.debug('Cron job scheduled', {
      jobKey,
      cronSchedule: schedule.schedule_cron,
      courseTitle: schedule.course_title
    });
  }

  /**
   * Получение всех активных расписаний
   */
  async getActiveSchedules() {
    try {
      const { rows } = await pool.query(`
        SELECT tis.*, c.title as course_title
        FROM test_import_schedules tis
        JOIN courses c ON tis.course_id = c.id
        WHERE tis.is_active = true
        ORDER BY tis.created_at DESC
      `);

      return rows;
    } catch (error) {
      logger.error('Error getting active schedules', { error });
      throw error;
    }
  }

  /**
   * Ручной запуск импорта для конкретного расписания
   */
  async runImportNow(courseId, part) {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM test_import_schedules 
        WHERE course_id = $1 AND part = $2 AND is_active = true
      `, [courseId, part]);

      if (rows.length === 0) {
        throw new Error('Schedule not found or inactive');
      }

      const schedule = rows[0];

      logger.info('Manual import started', {
        courseId,
        part,
        sheetId: schedule.sheet_id
      });

      const result = await importTestResultsFromSheet(
        schedule.sheet_id,
        courseId,
        part
      );

      // Обновляем время последнего импорта
      await pool.query(`
        UPDATE test_import_schedules 
        SET last_import_at = NOW() 
        WHERE course_id = $1 AND part = $2
      `, [courseId, part]);

      logger.info('Manual import completed', { courseId, part, result });

      return result;

    } catch (error) {
      logger.error('Manual import failed', { courseId, part, error });
      throw error;
    }
  }

  /**
   * Остановка всех cron jobs
   */
  stopAll() {
    logger.info('Stopping all scheduled imports...');
    
    for (const [jobKey, job] of this.scheduledJobs) {
      job.destroy();
      logger.debug('Stopped job', { jobKey });
    }
    
    this.scheduledJobs.clear();
    this.isInitialized = false;
    
    logger.info('All scheduled imports stopped');
  }

  /**
   * Получение статистики по планировщику
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      activeJobs: this.scheduledJobs.size,
      jobKeys: Array.from(this.scheduledJobs.keys())
    };
  }
}

// Создаем единственный экземпляр планировщика
const testImportScheduler = new TestImportScheduler();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, stopping test import scheduler...');
  testImportScheduler.stopAll();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, stopping test import scheduler...');
  testImportScheduler.stopAll();
  process.exit(0);
});

module.exports = testImportScheduler; 