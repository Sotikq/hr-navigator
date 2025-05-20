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
    const wrapText = (text, maxLineLength = 25) => {
      const regex = new RegExp(`(.{1,${maxLineLength}})(\\s|$)`, 'g');
      const lines = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        lines.push(match[1].trim());
      }
      return lines;
    };

    const nameLines = wrapText(fullName);

    const overlays = [
        // "СЕРТИФИКАТ" — Waffle Soft, 46, жирный
        { text: 'СЕРТИФИКАТ', fontSize: 46, left: 90, top: 85, color: '#1976d2', font: 'Arial Black' },
      
        // Подзаголовок — Montserrat, 25.8, жирный (разбито вручную)
        { text: 'о прохождении курсов по', fontSize: 26, left: 100, top: 145, color: '#000000', font: 'Arial Black' },
        { text: 'повышению квалификации', fontSize: 26, left: 90, top: 180, color: '#000000', font: 'Arial Black' },
      
        // "Выдан" — Open Sans, 22, жирный
        { text: 'Выдан', fontSize: 22, left: 240, top: 220, color: '#000000', font: 'Arial' },
      
        // Имя — Open Sans, 24, жирный
        // Автоматический перенос имени (до 30 символов на строку)
        ...wrapText(fullName, 30).map((line, i) => ({
          text: line,
          fontSize: 30,
          left: 95,
          top: 280 + i * 32, // шаг между строками
          color: '#000000',
          font: 'Arial'
        })),
      
        // Основной блок — Open Sans, 20
        { text: `в том, что он/она с «${endDate}» по «${endDate}» года`, fontSize: 20, left: 90, top: 340, color: '#000000', font: 'Arial' },
        { text: 'прошёл(а) повышение квалификации по курсу', fontSize: 20, left: 140, top: 370, color: '#000000', font: 'Arial' },
        // Автоматический перенос названия курса (до 50 символов на строку)
        ...wrapText(`“${courseTitle}”`, 50).map((line, i) => ({
          text: line,
          fontSize: 22,
          left: 0,
          top: 400 + i * 28, // шаг между строками
          color: '#000000',
          font: 'Arial Black'
        })),
        { text: `в общем объеме ${hours} часа`, fontSize: 20, left: 230, top: 430, color: '#000000', font: 'Arial' },
        { text: 'при ИП Hr Навигатор', fontSize: 20, left: 250, top: 460, color: '#000000', font: 'Arial' },
      
        // Номер сертификата
        { text: `I №${certNumber}`, fontSize: 14, left: 100, top: 510, color: '#000000', font: 'Arial' },
      
        // Дата
        { text: issuedAtStr, fontSize: 14, left: 100, top: 540, color: '#000000', font: 'Arial' },
      
        // Подпись (правый угол)
        { text: 'Наталья Побежук', fontSize: 16, left: 520, top: 525, color: '#000000', font: 'Arial' }
      ];      

    const svgText = overlays.map(o => `
      <text x="${o.left}" y="${o.top}" font-size="${o.fontSize}" fill="${o.color}" font-family="${o.font}">${o.text}</text>
    `).join('\n');

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
