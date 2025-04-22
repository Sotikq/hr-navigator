const authMiddleware = require("./middleware/authMiddleware");
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const courseRoutes = require("./routes/courseRoutes");
app.use("/api/courses", authMiddleware, courseRoutes);

app.get('/', (req, res) => {
  res.send('HR Navigator backend работает!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));  

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);



