const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs'); // добавляем для createWriteStream
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const pool = require('./config/db');
const logger = require('./utils/logger');
const User = require('./models/User');
const Course = require('./models/Course');
const LessonProgressModel = require('./models/lessonProgressModel');

const TEMPLATE_PATH = path.join(__dirname, 'uploads', 'certificates', 'certificate_template.jpg');
const OUTPUT_DIR = path.join(__dirname, 'uploads', 'certificates');

// Add text measurement utilities
const measureTextWidth = (text, fontSize, font) => {
  // Approximate width calculation based on font size and character count
  // Arial font has approximately 0.6 * fontSize width per character
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth;
};

const calculateMaxLineLength = (text, maxWidth, fontSize, font) => {
  const avgCharWidth = fontSize * 0.6;
  return Math.floor(maxWidth / avgCharWidth);
};

async function generateCertificate(userId, courseId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    logger.info(`Starting certificate generation for user ${userId}, course ${courseId}`);

    // 1. Idempotency
    const certCheck = await client.query(
      'SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2 AND revoked_at IS NULL',
      [userId, courseId]
    );
    if (certCheck.rows.length > 0) {
      logger.info('Certificate already exists for this user and course.');
      await client.query('ROLLBACK');
      return certCheck.rows[0];
    }

    // 2. Verify course completion
    const progress = await LessonProgressModel.getCourseProgress(userId, courseId);
    if (!progress.data || progress.data.progress < 100) {
      logger.info('Course not completed');
      await client.query('ROLLBACK');
      throw new Error('Course not completed');
    }

    // 3. Fetch user and course data
    const user = await User.findUserById(userId);
    const course = await Course.getCourseById(courseId);
    if (!user || !course) {
      await client.query('ROLLBACK');
      throw new Error('User or course not found');
    }

    const fullName = user.name;
    const courseTitle = course.title;
    const hours = course.duration;
    const issuedAt = new Date();
    const issuedAtStr = issuedAt.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    const startDate = course.created_at
      ? new Date(course.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
      : '...';
    const endDate = issuedAtStr;

    // 4. Certificate number
    const certUuid = uuidv4();
    const certNumber = certUuid.slice(0, 8).toUpperCase();

    // 5. Generate JPG
    const jpgFilename = `certificate_${userId}_${courseId}_${certNumber}.jpg`;
    const jpgPath = path.join(OUTPUT_DIR, jpgFilename);
    const image = sharp(TEMPLATE_PATH);
    const { width, height } = await image.metadata();   

    // Автоматически разбиваем длинные имена на строки (до 25 символов на строку)
    // Новый перенос по пиксельной ширине
    const wrapTextByWidth = (text, maxWidth, fontSize = 20, font = 'Arial') => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        if (measureTextWidth(testLine, fontSize, font) <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = words[i];
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };
    
    const nameLines = wrapTextByWidth(fullName, 600, 26, 'Arial'); // 600px для имени, можно скорректировать
    const courseLines = wrapTextByWidth(`"${courseTitle}"`, 38, 20, 'Arial Black');
    const shift = (courseLines.length - 1) * 28;
    
    // Center the name text relative to "Выдан" text
    // "Выдан" is positioned at left: 235, and we want the name text to be centered
    // relative to this position. Since we're using text-anchor: middle, we need to
    // account for the width of "Выдан" (approximately 80px) to find the true center
    const centerX = 235 + 40; // 235 (left edge) + half of "Выдан" width

    // Calculate the width of the date string to determine course title wrapping
    const dateString = `в том, что он/она с «${endDate}» по «${endDate}» года`;
    const dateStringLeft = 30; // Left position of the date string (where "в" starts)
    
    // Calculate the width of the date string up to "года"
    const dateStringWithoutYear = `в том, что он/она с «${endDate}» по «${endDate}»`;
    const dateStringWidth = measureTextWidth(dateStringWithoutYear, 20, 'Arial');
    const dateStringRight = dateStringLeft + dateStringWidth; // Right boundary (where "года" starts)
    
    // Calculate the width of the baseline string for centering
    const baselineString = 'прошёл(а) повышение квалификации по курсу';
    const baselineWidth = measureTextWidth(baselineString, 20, 'Arial');
    const baselineCenterX = 65 + (baselineWidth / 2); // 65 is the left position of the baseline string

    // Calculate available width for course title based on date string boundaries
    const rightPadding = 40; // немного смещаем правую границу левее
    const courseTitleMaxWidth = dateStringRight - dateStringLeft - rightPadding;
    
    // Wrap course title based on the exact pixel boundaries
    const courseLinesWrapped = wrapTextByWidth(`"${courseTitle}"`, courseTitleMaxWidth, 20, 'Arial Black');
    const shiftWrapped = (courseLinesWrapped.length - 1) * 28;

    const overlays = [
      // "СЕРТИФИКАТ" — Waffle Soft, 46, жирный
      { text: 'СЕРТИФИКАТ', fontSize: 46, left: 87, top: 85, color: '#1976d2', font: 'Arial Black' },
    
      // Подзаголовок — Montserrat, 25.8, жирный (разбито вручную)
      { text: 'о прохождении курсов по', fontSize: 26, left: 80, top: 135, color: '#000000', font: 'Arial Black' },
      { text: 'повышению квалификации', fontSize: 26, left: 75, top: 170, color: '#000000', font: 'Arial Black' },
    
      // "Выдан"
      { text: 'Выдан', fontSize: 22, left: 235, top: 220, color: '#000000', font: 'Arial' },
    
      // Имя (с переносом)
      ...nameLines.map((line, i) => ({
        text: line,
        fontSize: 24,
        left: centerX,           // именно центр
        top: 280 + i * 32,
        color: '#000000',
        font: 'Arial Black',
        align: 'center'   
      })),
    
      // Основной текст
      { text: `в том, что он/она с «${endDate}» по «${endDate}» года`, fontSize: 20, left: 30, top: 340, color: '#000000', font: 'Arial' },
      { text: 'прошёл(а) повышение квалификации по курсу', fontSize: 20, left: 80, top: 370, color: '#000000', font: 'Arial' },
    
      // Название курса (с переносом и центрированием)
      ...courseLinesWrapped.map((line, i) => ({
        text: line,
        fontSize: 20,
        left: baselineCenterX,
        top: 400 + i * 28,
        color: '#000000',
        font: 'Arial Black',
        align: 'center'
      })),
    
      // Смещённые элементы ↓
      { text: `в общем объеме ${hours} часа`, fontSize: 20, left: 170, top: 430 + shiftWrapped, color: '#000000', font: 'Arial' },
      { text: 'при ИП Hr Навигатор', fontSize: 20, left: 190, top: 460 + shiftWrapped, color: '#000000', font: 'Arial' },
    
      { text: `I №${certNumber}`, fontSize: 14, left: 40, top: 510 + shiftWrapped, color: '#000000', font: 'Arial' },
      { text: issuedAtStr, fontSize: 14, left: 40, top: 540 + shiftWrapped, color: '#000000', font: 'Arial' },
      { text: '_____________________', fontSize: 14, left: 190, top: 525 + shiftWrapped, color: '#000000', font: 'Arial' },
      { text: 'Наталья Побежук', fontSize: 16, left: 420, top: 525 + shiftWrapped, color: '#000000', font: 'Arial' }
    ];

    const svgText = overlays.map(o => {
      const anchor = o.align === 'center' ? 'middle' : 'start';
      return `
        <text x="${o.left}" y="${o.top}" font-size="${o.fontSize}" fill="${o.color}" font-family="${o.font}" text-anchor="${anchor}">
          ${o.text}
        </text>`;
    }).join('\n');
    

    const svgOverlay = Buffer.from(`<svg width="${width}" height="${height}">${svgText}</svg>`);

    await image.composite([{ input: svgOverlay, top: 0, left: 0 }]).jpeg().toFile(jpgPath);
    logger.info('Certificate image generated', { jpgPath });

    // 6. Generate PDF
    const pdfFilename = jpgFilename.replace('.jpg', '.pdf');
    const pdfPath = path.join(OUTPUT_DIR, pdfFilename);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const pdfStream = fsSync.createWriteStream(pdfPath);
    doc.pipe(pdfStream);
    doc.image(jpgPath, 0, 0, { width: 842, height: 595 });
    doc.end();

    await new Promise((resolve, reject) => {
      pdfStream.on('finish', resolve);
      pdfStream.on('error', reject);
    });
    logger.info('Certificate PDF generated', { pdfPath });

    // 7. Insert into DB
    const insertQuery = `
      INSERT INTO certificates (id, certificate_number, user_id, course_id, hours, issued_at, file_path, qr_code_url, is_valid, created_at, updated_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW(), 1)
      RETURNING *`;
    const fileUrl = `/uploads/certificates/${jpgFilename}`;
    const values = [certUuid, certNumber, userId, courseId, hours, issuedAt, fileUrl, null];
    const { rows: [certRecord] } = await client.query(insertQuery, values);

    await client.query('COMMIT');
    logger.info('Certificate record inserted', { id: certUuid });

    return certRecord;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Certificate generation failed', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { generateCertificate };
