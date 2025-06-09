const axios = require('axios').default;

// Конфигурация для тестов
const API_BASE = 'https://server.hrnavigator.kz/api';
const ADMIN_TOKEN = 'your-admin-jwt-token-here'; // Замените на реальный токен админа

async function testEmailAPI() {
  console.log('🧪 Testing Email API Endpoints...\n');

  // Test 1: Password Reset Request
  console.log('📧 Test 1: Password Reset Request');
  try {
    const response = await axios.post(`${API_BASE}/email/password-reset`, {
      email: 'test@example.com'
    });
    console.log('✅ Password reset request:', response.data.message);
  } catch (err) {
    console.log('❌ Password reset failed:', err.response?.data?.message || err.message);
  }

  // Test 2: Email Queue Status (требует admin token)
  console.log('\n📊 Test 2: Email Queue Status');
  try {
    const response = await axios.get(`${API_BASE}/email/queue-status`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    console.log('✅ Queue status:', response.data);
  } catch (err) {
    console.log('❌ Queue status failed:', err.response?.data?.message || err.message);
  }

  // Test 3: Test Email (требует admin token)
  console.log('\n📧 Test 3: Test Email');
  try {
    const response = await axios.post(`${API_BASE}/email/test`, {
      to: 'test@example.com',
      subject: 'API Test Email',
      message: 'Это тестовое сообщение через API'
    }, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    console.log('✅ Test email sent:', response.data.message);
  } catch (err) {
    console.log('❌ Test email failed:', err.response?.data?.message || err.message);
  }

  // Test 4: Bulk Email (требует admin token)
  console.log('\n📮 Test 4: Bulk Email');
  try {
    const response = await axios.post(`${API_BASE}/email/bulk-send`, {
      subject: 'Тестовая рассылка через API',
      content: '<h2>Новости HR Navigator</h2><p>Это тестовая рассылка через API.</p>',
      type: 'newsletter'
      // userIds не указываем - отправится всем активным пользователям
    }, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    console.log('✅ Bulk email sent:', response.data);
  } catch (err) {
    console.log('❌ Bulk email failed:', err.response?.data?.message || err.message);
  }

  console.log('\n🎉 Email API Testing Complete!');
}

// Запускаем тесты
if (require.main === module) {
  console.log('⚠️  Make sure to update ADMIN_TOKEN before running tests');
  console.log('⚠️  Make sure your server is running on', API_BASE);
  console.log('');
  testEmailAPI().catch(console.error);
}

module.exports = testEmailAPI; 