const multer = require('multer');
const path = require('path');

// === 📁 Общая функция генерации хранилища ===
const createStorage = (folder) => multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `uploads/${folder}`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// === 🖼 Загрузка изображений (обложки курсов) ===
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый формат изображения'), false);
  }
};

const uploadImage = multer({
  storage: createStorage('covers'), // теперь → uploads/covers/
  fileFilter: imageFilter
});

// === 🎥 Загрузка видеоотзывов ===
const videoFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/quicktime']; // .mp4, .mov
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый формат видео'), false);
  }
};

const uploadVideo = multer({
  storage: createStorage('reviews'), // → uploads/reviews/
  fileFilter: videoFilter
});

module.exports = {
  uploadImage,
  uploadVideo
};
