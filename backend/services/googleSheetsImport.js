const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const logger = require('../utils/logger');
const path = require('path');

// Путь к JSON-файлу с credentials сервисного аккаунта
const CREDENTIALS_PATH = path.join(__dirname, '../config/hr-navigator-461812-44454d524469.json');

/**
 * Импорт результатов теста из Google Sheets
 * @param {string} sheetId - ID Google Sheets (из URL)
 * @param {string} courseId - ID курса в нашей БД
 * @param {number} part - номер части теста (1 или 2)
 * @param {string} range - диапазон ячеек (например, 'A1:Z1000')
 * @returns {Promise<Object>} результат импорта
 */
async function importTestResultsFromSheet(sheetId, courseId, part, range = 'A1:Z1000') {
  try {
    logger.info('Starting import from Google Sheets', { sheetId, courseId, part });

    // 1. Авторизация с использованием сервисного аккаунта
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 2. Получение данных из Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      logger.warn('No data found in Google Sheets', { sheetId, range });
      return { success: false, message: 'No data found in sheet', imported: 0 };
    }

    // 3. Парсинг заголовков (ищем нужные колонки)
    const headers = rows[0].map(h => h.toLowerCase().trim());
    
    // Расширенный список поиска email колонки
    const emailIdx = findColumnIndex(headers, [
      'email', 
      'e-mail', 
      'электронная почта', 
      'адрес электронной почты',
      'email address',
      'почта',
      'мейл',
      'mail',
      'эл. почта',
      'эл.почта'
    ]);
    
    const scoreIdx = findColumnIndex(headers, ['балл', 'score', 'баллы', 'очки']);
    const timestampIdx = findColumnIndex(headers, ['timestamp', 'дата', 'время', 'отметка времени']);

    if (emailIdx === -1) {
      // Логируем все заголовки для отладки
      logger.error('Email column not found. Available headers:', { headers });
      throw new Error(`Email column not found in sheet. Available columns: ${headers.join(', ')}`);
    }

    let imported = 0;
    let errors = [];

    // 4. Обработка каждой строки с данными
    for (let i = 1; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const email = row[emailIdx]?.trim().toLowerCase();
        if (!email || !isValidEmail(email)) {
          errors.push(`Row ${i + 1}: Invalid email "${email}"`);
          continue;
        }

        // Парсинг баллов
        let score = null;
        let maxScore = 100; // по умолчанию
        
        if (scoreIdx !== -1 && row[scoreIdx]) {
          const scoreText = row[scoreIdx].toString();
          const scoreMatch = scoreText.match(/(\d+)(?:\s*\/\s*(\d+))?/);
          if (scoreMatch) {
            score = parseInt(scoreMatch[1], 10);
            if (scoreMatch[2]) {
              maxScore = parseInt(scoreMatch[2], 10);
            }
          }
        }

        // Парсинг времени прохождения
        let submittedAt = new Date();
        if (timestampIdx !== -1 && row[timestampIdx]) {
          const parsedDate = new Date(row[timestampIdx]);
          if (!isNaN(parsedDate.getTime())) {
            submittedAt = parsedDate;
          }
        }

        // 5. Поиск пользователя по email
        const { rows: userRows } = await pool.query(
          'SELECT id FROM users WHERE LOWER(email) = $1',
          [email]
        );

        if (!userRows.length) {
          errors.push(`Row ${i + 1}: User not found for email "${email}"`);
          continue;
        }

        const userId = userRows[0].id;

        // 6. Создание детального JSON с ответами
        const details = {
          raw_data: row,
          headers: headers,
          imported_at: new Date().toISOString(),
          sheet_id: sheetId,
          row_number: i + 1
        };

        // 7. Вставка или обновление результата
        await pool.query(`
          INSERT INTO test_results (id, user_id, course_id, form_url, part, score, max_score, details, submitted_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (user_id, course_id, part)
          DO UPDATE SET 
            score = EXCLUDED.score,
            max_score = EXCLUDED.max_score,
            details = EXCLUDED.details,
            submitted_at = EXCLUDED.submitted_at,
            form_url = EXCLUDED.form_url
        `, [
          uuidv4(),
          userId,
          courseId,
          `https://docs.google.com/spreadsheets/d/${sheetId}`,
          part,
          score,
          maxScore,
          JSON.stringify(details),
          submittedAt
        ]);

        imported++;
        logger.debug('Imported test result', { email, score, maxScore, part });

      } catch (rowError) {
        errors.push(`Row ${i + 1}: ${rowError.message}`);
        logger.error('Error processing row', { row: i + 1, error: rowError });
      }
    }

    logger.info('Import completed', { imported, errors: errors.length });

    return {
      success: true,
      imported,
      total_rows: rows.length - 1,
      errors
    };

  } catch (error) {
    logger.error('Error importing from Google Sheets', { sheetId, courseId, part, error });
    throw error;
  }
}

/**
 * Поиск индекса колонки по возможным названиям
 */
function findColumnIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Простая валидация email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Получение информации о Google Sheet (метаданные)
 */
async function getSheetInfo(sheetId) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'properties,sheets.properties'
    });

    return {
      title: response.data.properties.title,
      sheets: response.data.sheets.map(sheet => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId,
        gridProperties: sheet.properties.gridProperties
      }))
    };
  } catch (error) {
    logger.error('Error getting sheet info', { sheetId, error });
    throw error;
  }
}

module.exports = {
  importTestResultsFromSheet,
  getSheetInfo
}; 