const { getAllReviews, addReview } = require('../models/Review');

async function getReviewsHandler(req, res) {
  try {
    const reviews = await getAllReviews();
    res.json(reviews);
  } catch (err) {
    console.error('Ошибка получения отзывов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function addReviewHandler(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Файл обязателен' });

    const host = `${req.protocol}://${req.get('host')}`;
    const fullUrl = `${host}/uploads/reviews/${file.filename}`;
    const review = await addReview(fullUrl);
    res.status(201).json(review);
  } catch (err) {
    console.error('Ошибка загрузки отзыва:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}


async function getReviewByNameHandler(req, res) {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', 'reviews', filename);

    // Проверка: существует ли файл
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    // Определение MIME-типа (например, video/mp4)
    const mime = require('mime-types');
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Ошибка при отправке файла:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getReviewsHandler, addReviewHandler, getReviewByNameHandler };
