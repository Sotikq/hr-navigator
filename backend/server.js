require('dotenv').config();
const authMiddleware = require("./middleware/authMiddleware");
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const courseRoutes = require('./routes/courseRoutes');
app.use('/api/courses', courseRoutes);

app.get('/', (req, res) => {
  res.send('HR Navigator backend работает!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));  

const authRoutes = require('./routes/authRoutes'); // путь может отличаться
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/auth', userRoutes);

