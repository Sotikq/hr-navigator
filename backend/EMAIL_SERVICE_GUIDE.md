# 📧 Email Service - Полное руководство

## 🚀 Что реализовано (за 30 минут!)

### ✅ **SMTP настройка**
- Gmail SMTP интеграция 
- Автоматическая проверка подключения
- Graceful fallback при отсутствии настроек

### ✅ **Email шаблоны**
- 🎉 Welcome email при регистрации
- 💰 Подтверждение платежа
- ❌ Отклонение платежа  
- 🎓 Выдача сертификата
- 🔐 Сброс пароля
- 📚 Новые уроки (готово к использованию)
- 📰 Массовые рассылки

### ✅ **Очередь email**
- Простая in-memory очередь
- Автоматические повторные попытки (3 раза)
- Пауза между отправками (1 сек)
- Логирование всех операций

### ✅ **API Endpoints**
- `POST /api/email/password-reset` - Запрос сброса пароля
- `POST /api/email/reset-password` - Сброс пароля по токену  
- `POST /api/email/test` - Тест email (админ)
- `POST /api/email/bulk-send` - Массовая рассылка (админ)
- `GET /api/email/queue-status` - Статус очереди (админ)

### ✅ **Интеграция**
- Автоматические уведомления при регистрации
- Уведомления при подтверждении/отклонении платежей
- Email при выдаче сертификатов

## 🔧 Настройка (.env файл)

Добавьте в ваш `.env`:

```bash
# EMAIL CONFIGURATION (обязательно)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=HR Navigator <your-gmail@gmail.com>
EMAIL_REPLY_TO=admin@hrnavigator.kz
```

## 📋 Ручные действия для запуска

### 1. Gmail App Password
1. Включите 2FA в Google аккаунте
2. Перейдите: Google Account → Security → 2-Step Verification → App passwords
3. Создайте пароль для "Mail" → "Other (HR Navigator)"
4. Скопируйте 16-символьный пароль

### 2. Обновите .env
```bash
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # 16-символьный пароль
```

### 3. Перезапустите сервер
```bash
npm restart  # или pm2 restart
```

## 🧪 Тестирование

### Тест 1: Email Service
```bash
node testEmailService.js
```

### Тест 2: API Endpoints  
```bash
# Сначала получите admin JWT токен, затем:
node testEmailAPI.js
```

### Тест 3: Через API
```bash
# Тест сброса пароля
curl -X POST https://server.hrnavigator.kz/api/email/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Статус очереди (нужен admin токен)
curl -X GET https://server.hrnavigator.kz/api/email/queue-status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📧 Использование в коде

### Отправка welcome email
```javascript
const emailService = require('./services/emailService');
await emailService.sendWelcomeEmail(user);
```

### Уведомление о платеже
```javascript
await emailService.sendPaymentConfirmation(user, course, payment);
```

### Массовая рассылка
```javascript
await emailService.sendBulkEmail(
  userList, 
  'Новости HR Navigator',
  '<h2>Новости</h2><p>Контент рассылки</p>',
  'newsletter'
);
```

## 🎯 API Документация

### Password Reset
```bash
POST /api/email/password-reset
{
  "email": "user@example.com"
}
```

### Bulk Email (Admin only)
```bash
POST /api/email/bulk-send
Authorization: Bearer ADMIN_TOKEN
{
  "subject": "Newsletter Subject",
  "content": "<h1>HTML Content</h1>",
  "type": "newsletter",
  "userIds": ["user1", "user2"] // опционально
}
```

### Test Email (Admin only)
```bash
POST /api/email/test
Authorization: Bearer ADMIN_TOKEN
{
  "to": "test@example.com",
  "subject": "Test Subject",
  "message": "Test message"
}
```

## 🔍 Мониторинг

### Логи
```bash
# Логи email отправки
pm2 logs hr-navigator-backend | grep -i email

# Статус очереди
curl -H "Authorization: Bearer TOKEN" \
  https://server.hrnavigator.kz/api/email/queue-status
```

### Проверка health
```bash
# В логах сервера при старте:
"Email service initialized successfully"
# или
"Email credentials not configured, email service disabled"
```

## ⚠️ Troubleshooting

### Проблема: "Email service not initialized"
**Решение:** Проверьте EMAIL_USER и EMAIL_PASS в .env

### Проблема: "Authentication failed"
**Решение:** 
1. Проверьте app password (16 символов)
2. Убедитесь что 2FA включена в Gmail
3. Попробуйте создать новый app password

### Проблема: Email не отправляются
**Решение:**
1. Проверьте статус очереди: `/api/email/queue-status`
2. Посмотрите логи: `pm2 logs hr-navigator-backend`
3. Проверьте интернет соединение сервера

## 🎉 Готовые фичи для диплома

✅ **Welcome emails** - работают автоматически при регистрации  
✅ **Payment notifications** - при подтверждении/отклонении  
✅ **Certificate emails** - при выдаче сертификатов  
✅ **Password reset** - готовая система сброса паролей  
✅ **Bulk emails** - админ панель для рассылок  
✅ **Email queue** - надежная доставка с повторными попытками  
✅ **Health monitoring** - статус email системы  

## 🚀 Время реализации: 30 минут!

Все готово для демонстрации на защите диплома! 🎓 