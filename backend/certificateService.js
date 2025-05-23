const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs'); // добавляем для createWriteStream
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
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

async function generateQRCode(certificateNumber) {
  const verificationUrl = `http://localhost:5000/verify.html?code=${certificateNumber}`;
  try {
    // Generate QR code as base64
    const qrCodeBase64 = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200
    });
    return qrCodeBase64;
  } catch (err) {
    logger.error('QR code generation failed', { error: err.message });
    throw err;
  }
}

async function generateCertificate(userId, courseId) {
  logger.info('[CERT] Старт генерации сертификата', { userId, courseId });
  const client = await pool.connect();
  let transactionStarted = false;
  let cleanup = null;

  // Set overall timeout for the entire operation
  const timeout = setTimeout(() => {
    logger.error('[CERT] Таймаут генерации сертификата', { userId, courseId });
    cleanup?.();
    throw new Error('Certificate generation timed out');
  }, 30000);

  try {
    logger.info('[CERT] BEGIN transaction');
    await client.query('BEGIN');
    transactionStarted = true;
    logger.info('[CERT] Транзакция начата');

    // 1. Idempotency check
    logger.info('[CERT] Проверка на существование сертификата');
    const certCheck = await client.query(
      'SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2 AND revoked_at IS NULL',
      [userId, courseId]
    );
    if (certCheck.rows.length > 0) {
      logger.info('[CERT] Сертификат уже существует', { userId, courseId });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Certificate already exists');
    }
    logger.info('[CERT] Сертификата еще нет');

    // 2. Payment check
    logger.info('[CERT] Проверка оплаты');
    const paymentQuery = `
      SELECT confirmed_at 
      FROM payments 
      WHERE user_id = $1 AND course_id = $2 AND status = 'confirmed'
      ORDER BY confirmed_at ASC
      LIMIT 1
    `;
    const { rows: paymentRows } = await client.query(paymentQuery, [userId, courseId]);
    const confirmedAt = paymentRows[0]?.confirmed_at;
    if (!confirmedAt) {
      logger.info('[CERT] Оплата не подтверждена', { userId, courseId });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Payment not confirmed');
    }
    logger.info('[CERT] Оплата подтверждена', { confirmedAt });

    // 3. Progress check
    logger.info('[CERT] Проверка прогресса курса');
    const progress = await LessonProgressModel.getCourseProgress(userId, courseId);
    logger.info('[CERT] Прогресс получен', { progress });
    if (!progress.data || progress.data.progress < 100) {
      logger.info('[CERT] Курс не завершен', { progress: progress.data?.progress });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Course not completed');
    }
    logger.info('[CERT] Курс завершен', { progress: progress.data.progress });

    // 4. Fetch user and course data
    logger.info('[CERT] Получение данных пользователя и курса');
    const user = await User.findUserById(userId);
    const course = await Course.getCourseById(courseId);
    if (!user || !course) {
      logger.info('[CERT] Не найден пользователь или курс', { userFound: !!user, courseFound: !!course });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('User or course not found');
    }
    logger.info('[CERT] Данные пользователя и курса получены', { userName: user.name, courseTitle: course.title });

    const fullName = user.name;
    const courseTitle = course.title;
    const hours = course.duration;
    const issuedAt = new Date();
    const issuedAtStr = issuedAt.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    const startDate = confirmedAt
      ? new Date(confirmedAt).toLocaleDateString('ru-RU', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : '...';
    const endDate = issuedAtStr;

    // 5. Certificate number
    logger.info('[CERT] Генерация номера сертификата');
    const certUuid = uuidv4();
    const certNumber = certUuid.slice(0, 8).toUpperCase();
    logger.info('[CERT] Номер сертификата сгенерирован', { certNumber });

    // 6. Generate QR code
    logger.info('[CERT] Генерация QR-кода');
    const qrSize = 120;
    let qrCodeBase64;
    try {
      qrCodeBase64 = await Promise.race([
        QRCode.toDataURL(`http://localhost:5000/verify.html?code=${certNumber}`, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: qrSize
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('QR code generation timeout')), 10000))
      ]);
      logger.info('[CERT] QR-код успешно сгенерирован');
    } catch (err) {
      logger.error('[CERT] Ошибка генерации QR-кода', { error: err.message });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('QR code generation failed');
    }

    // 7. Generate JPG with QR code
    logger.info('[CERT] Генерация JPG сертификата');
    const jpgFilename = `certificate_${userId}_${courseId}_${certNumber}.jpg`;
    const jpgPath = path.join(OUTPUT_DIR, jpgFilename);
    let width, height;
    try {
      logger.info('[CERT] Загрузка шаблона сертификата');
      const image = sharp(TEMPLATE_PATH);
      ({ width, height } = await image.metadata());
      logger.info('[CERT] Шаблон загружен', { width, height });
      
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
        { text: `в том, что он/она с «${startDate}» по «${endDate}» года`, fontSize: 20, left: 30, top: 340, color: '#000000', font: 'Arial' },
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
        { text: 'Наталья Побежук', fontSize: 16, left: 420, top: 525 + shiftWrapped, color: '#000000', font: 'Arial' },
        { input: Buffer.from(qrCodeBase64.split(',')[1], 'base64'), top: height - qrSize - 0, left: width - qrSize - 0, width: qrSize, height: qrSize }
      ];

      const svgText = overlays.map(o => {
        if (o.input) {
          return `<image x="${o.left}" y="${o.top}" width="${o.width || qrSize}" height="${o.height || qrSize}" href="data:image/png;base64,${o.input.toString('base64')}" />`;
        }
        const anchor = o.align === 'center' ? 'middle' : 'start';
        return `
          <text x="${o.left}" y="${o.top}" font-size="${o.fontSize}" fill="${o.color}" font-family="${o.font}" text-anchor="${anchor}">
            ${o.text}
          </text>`;
      }).join('\n');
      

      logger.info('🎨 Creating SVG overlay');
      const svgOverlay = Buffer.from(`<svg width="${width}" height="${height}">${svgText}</svg>`);
      logger.info('✅ SVG overlay created');

      logger.info('🖌️ Composing final image');
      await Promise.race([
        image.composite([{ input: svgOverlay, top: 0, left: 0 }]).jpeg().toFile(jpgPath),
        new Promise((_, reject) => setTimeout(() => reject(new Error('JPG generation timeout')), 15000))
      ]);
      logger.info('✅ Certificate image generated', { jpgPath });
    } catch (err) {
      logger.error('[CERT] Ошибка генерации JPG', { error: err.message });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('JPG generation failed');
    }

    // 8. Generate PDF
    const pdfFilename = jpgFilename.replace('.jpg', '.pdf');
    const pdfPath = path.join(OUTPUT_DIR, pdfFilename);
    let pdfStream;
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
      pdfStream = fsSync.createWriteStream(pdfPath);
      doc.pipe(pdfStream);
      doc.image(jpgPath, 0, 0, { width: 842, height: 595 });
      doc.end();
      await Promise.race([
        new Promise((resolve, reject) => {
          pdfStream.on('finish', resolve);
          pdfStream.on('error', reject);
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 15000))
      ]);
      logger.info('Certificate PDF generated', { pdfPath });
    } catch (err) {
      logger.error('Certificate PDF generation failed', { error: err.message });
      if (pdfStream) pdfStream.close();
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Certificate PDF generation failed');
    }

    // 9. Insert into DB
    logger.info('[CERT] Сохранение сертификата в БД');
    const fileUrl = `/uploads/certificates/${jpgFilename}`;

    // Validate required data
    logger.info('🔍 Validating required data before database insertion');
    
    if (!fileUrl) {
      logger.error('❌ File URL is missing');
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Certificate file URL is missing');
    }

    if (!qrCodeBase64) {
      logger.error('❌ QR code is missing');
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Certificate QR code is missing');
    }

    if (!certNumber) {
      logger.error('❌ Certificate number is missing');
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Certificate number is missing');
    }

    // Verify JPG file exists
    logger.info('📂 Verifying JPG file exists', { jpgPath });
    if (!fsSync.existsSync(jpgPath)) {
      logger.error('❌ Certificate image file is missing', { jpgPath });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Certificate image missing');
    }
    logger.info('✅ JPG file verified');

    const insertQuery = `
      INSERT INTO certificates (
        id,
        certificate_number,
        user_id,
        course_id,
        hours,
        issued_at,
        file_path,
        qr_code_url,
        is_valid,
        revoked_at,
        revocation_reason,
        version,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`;
    const values = [
      certUuid,           // id
      certNumber,         // certificate_number
      userId,             // user_id
      courseId,           // course_id
      course.duration,    // hours
      issuedAt,           // issued_at
      fileUrl,            // file_path
      `http://localhost:5000/verify.html?code=${certNumber}`, // qr_code_url
      true,               // is_valid
      null,               // revoked_at
      null,               // revocation_reason
      1                   // version
    ];

    let certRecord;
    try {
      logger.info('📝 Executing database insert with values:', {
        id: values[0],
        certificateNumber: values[1],
        userId: values[2],
        courseId: values[3],
        hours: values[4],
        filePath: values[6],
        qrCodeUrl: values[7]
      });

      const { rows } = await client.query(insertQuery, values);
      certRecord = rows[0];
      
      logger.info('✅ Database insert successful, committing transaction');
      await client.query('COMMIT');
      
      logger.info('[CERT] Сертификат успешно сохранен в БД');
    } catch (err) {
      logger.error('❌ Certificate DB insert failed', { 
        error: err.message,
        stack: err.stack,
        values: {
          id: values[0],
          certificateNumber: values[1],
          userId: values[2],
          courseId: values[3],
          hours: values[4],
          filePath: values[6],
          qrCodeUrl: values[7]
        }
      });
      if (transactionStarted) await client.query('ROLLBACK');
      throw new Error('Certificate DB insert failed');
    }

    clearTimeout(timeout);
    logger.info('[CERT] Генерация сертификата завершена УСПЕШНО', { userId, courseId });
    return certRecord;
  } catch (err) {
    logger.error('[CERT] Ошибка в процессе генерации сертификата', { error: err.message, userId, courseId });
    if (transactionStarted) await client.query('ROLLBACK');
    clearTimeout(timeout);
    throw err;
  } finally {
    client.release();
    logger.info('[CERT] Соединение с БД освобождено');
  }
}

async function validateCertificate(certificateNumber) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        c.certificate_number,
        c.issued_at,
        c.version,
        c.revoked_at,
        c.revocation_reason,
        u.name as user_name,
        co.title as course_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.certificate_number = $1
    `;

    const { rows } = await client.query(query, [certificateNumber]);

    if (rows.length === 0) {
      return {
        status: 'error',
        message: 'Сертификат не найден'
      };
    }

    const cert = rows[0];

    if (cert.revoked_at) {
      return {
        status: 'revoked',
        message: 'Этот сертификат был отозван',
        details: {
          revokedAt: cert.revoked_at,
          revocationReason: cert.revocation_reason
        }
      };
    }

    return {
      status: 'valid',
      certificate: {
        certificateNumber: cert.certificate_number,
        userName: cert.user_name,
        courseTitle: cert.course_title,
        issuedAt: cert.issued_at,
        version: cert.version
      }
    };
  } finally {
    client.release();
  }
}

module.exports = { 
  generateCertificate,
  validateCertificate
};
