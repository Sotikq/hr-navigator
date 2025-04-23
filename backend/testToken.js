require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIyMDk4NmVhLWJlNTMtNDBjYi1hMWE0LTAxYzk0Zjg3ZTg0ZCIsInJvbGUiOiJ0ZWFjaGVyIiwiZW1haWwiOiJ0ZXN0dXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc0NTQxMDc1NCwiZXhwIjoxNzQ1NDk3MTU0fQ.CuAVy2mwCx2A8nS2lvkBQ3ZYb10gG2QxJKYiQv6oHaU'; // вставь свой токен
const JWT_SECRET = process.env.JWT_SECRET;

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Токен валиден!');
  console.log('Декодированные данные:', decoded);
} catch (err) {
  console.error('❌ Токен невалиден:', err.message);
}
