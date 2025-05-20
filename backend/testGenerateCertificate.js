const { generateCertificate } = require('./certificateService');

// ⚠️ Замените на реальные значения из вашей базы
const userId = '05b08e39-aa7c-405f-bef3-9b505b956ea3';
const courseId = 'a5a01020-824f-4d03-9fed-30c24d59e97f';

generateCertificate(userId, courseId)
  .then((cert) => {
    console.log('[✅] Сертификат успешно создан:', cert);
  })
  .catch((err) => {
    console.error('[❌] Ошибка при создании сертификата:', err.message);
  });
