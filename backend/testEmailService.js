const emailService = require('./services/emailService');
const logger = require('./utils/logger');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Test 1: Basic Email Sending
  console.log('📧 Test 1: Basic Email');
  try {
    await emailService.sendEmail(
      'test@example.com',
      'Test Email from HR Navigator',
      '<h1>Test Email</h1><p>This is a test email from HR Navigator system.</p>'
    );
    console.log('✅ Basic email test passed');
  } catch (err) {
    console.log('❌ Basic email test failed:', err.message);
  }

  // Test 2: Welcome Email Template
  console.log('\n📧 Test 2: Welcome Email Template');
  const testUser = {
    id: 'test-123',
    name: 'Тест Пользователь',
    email: 'test@example.com'
  };
  
  try {
    await emailService.sendWelcomeEmail(testUser);
    console.log('✅ Welcome email test passed');
  } catch (err) {
    console.log('❌ Welcome email test failed:', err.message);
  }

  // Test 3: Certificate Email Template
  console.log('\n📧 Test 3: Certificate Email Template');
  const testCourse = {
    id: 'course-123',
    title: 'Тестовый курс HR',
    duration: 40
  };
  
  try {
    await emailService.sendCertificateIssued(
      testUser, 
      testCourse, 
      'https://server.hrnavigator.kz/certificates/test.pdf'
    );
    console.log('✅ Certificate email test passed');
  } catch (err) {
    console.log('❌ Certificate email test failed:', err.message);
  }

  // Test 4: Payment Confirmation
  console.log('\n📧 Test 4: Payment Confirmation Template');
  const testPayment = {
    id: 'payment-123',
    amount: 25000
  };
  
  try {
    await emailService.sendPaymentConfirmation(testUser, testCourse, testPayment);
    console.log('✅ Payment confirmation test passed');
  } catch (err) {
    console.log('❌ Payment confirmation test failed:', err.message);
  }

  // Test 5: Queue Status
  console.log('\n📊 Test 5: Queue Status');
  console.log('Queue length:', emailService.emailQueue.length);
  console.log('Is processing:', emailService.isProcessing);

  // Test 6: Bulk Email (small test)
  console.log('\n📧 Test 6: Bulk Email');
  const testUsers = [
    { id: '1', name: 'Пользователь 1', email: 'test1@example.com' },
    { id: '2', name: 'Пользователь 2', email: 'test2@example.com' }
  ];
  
  try {
    await emailService.sendBulkEmail(
      testUsers,
      'Тестовая рассылка HR Navigator',
      '<h2>Новости от HR Navigator</h2><p>Это тестовая рассылка для всех пользователей.</p>',
      'newsletter'
    );
    console.log('✅ Bulk email test passed');
  } catch (err) {
    console.log('❌ Bulk email test failed:', err.message);
  }

  console.log('\n🎉 Email Service Testing Complete!');
  console.log('📧 Check your email queue and logs for detailed results.');
}

// Запускаем тесты
if (require.main === module) {
  testEmailService().catch(console.error);
}

module.exports = testEmailService; 