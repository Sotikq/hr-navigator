const multer = require('multer');
const path = require('path');

// 📁 Папка для хранения загруженных файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Все файлы будут сохраняться в папку uploads/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext); // Пример: cover-123456789.png
  }
});

// Фильтрация: разрешаем загружать только картинки
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый формат файла'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
