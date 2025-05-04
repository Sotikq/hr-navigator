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

    const review = await addReview(file.filename);
    res.status(201).json(review);
  } catch (err) {
    console.error('Ошибка загрузки отзыва:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = { getReviewsHandler, addReviewHandler };
