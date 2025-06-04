# Настройка импорта результатов тестов из Google Sheets

## 📋 Оглавление
1. [Установка зависимостей](#установка-зависимостей)
2. [Настройка Google Service Account](#настройка-google-service-account)
3. [Настройка заказчика](#настройка-заказчика)
4. [Запуск миграций БД](#запуск-миграций-бд)
5. [API эндпоинты](#api-эндпоинты)
6. [Примеры использования](#примеры-использования)
7. [Автоматический импорт](#автоматический-импорт)
8. [Troubleshooting](#troubleshooting)

## 🚀 Установка зависимостей

```bash
npm install googleapis node-cron
```

## 🔑 Настройка Google Service Account

### 1. JSON файл credentials
Поместите файл `hr-navigator-461812-44454d524469.json` в папку:
```
backend/config/hr-navigator-461812-44454d524469.json
```

**⚠️ ВАЖНО:** Не коммитьте этот файл в git! Добавьте его в `.gitignore`.

### 2. Права сервисного аккаунта
Сервисный email: `hr-navigator@hr-navigator-461812.iam.gserviceaccount.com`

Этот email должен быть добавлен как "Читатель" (Viewer) к каждому Google Sheet с ответами.

## 👩‍💼 Настройка заказчика

### Инструкция для заказчицы:

1. **Создание Google Form**
   - Создайте Google Form с обязательным полем email
   - Убедитесь, что в форме есть поля для баллов (если автопроверка)

2. **Создание Google Sheets**
   - В Google Form перейдите на вкладку "Ответы"
   - Нажмите на иконку Google Sheets (создать таблицу)
   - Скопируйте ID созданной таблицы (из URL)

3. **Предоставление доступа**
   - Откройте созданную Google Sheets
   - Нажмите "Поделиться"
   - Добавьте email: `hr-navigator@hr-navigator-461812.iam.gserviceaccount.com`
   - Установите права: "Читатель" (Viewer)

4. **Получение Sheet ID**
   - Из URL вида: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
   - Скопируйте SHEET_ID

## 🗄️ Запуск миграций БД

Выполните SQL миграции в Supabase:

```sql
-- 1. Ограничение типа урока
\i backend/migrations/003_add_lesson_type_constraint.sql

-- 2. Таблица расписаний импорта
\i backend/migrations/004_create_test_import_schedules.sql
```

## 🔗 API эндпоинты

### Для пользователей:
- `GET /api/test-results/my` - мои результаты тестов
- `GET /api/test-results/my/course/{courseId}` - статус по курсу
- `GET /api/test-results/my/course/{courseId}/part/{part}` - результат части теста

### Для админов:
- `POST /api/test-results/import` - импорт из Google Sheets
- `GET /api/test-results/course/{courseId}` - все результаты по курсу
- `GET /api/test-results/course/{courseId}/statistics` - статистика
- `GET /api/test-results/sheet-info/{sheetId}` - информация о листе

## 📊 Примеры использования

### 1. Ручной импорт результатов

```bash
curl -X POST http://localhost:5000/api/test-results/import \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "courseId": "course-uuid-here",
    "part": 1,
    "range": "A1:Z1000"
  }'
```

### 2. Получение результатов пользователя

```bash
curl -X GET http://localhost:5000/api/test-results/my/course/course-uuid-here \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 3. Статистика по курсу (админ)

```bash
curl -X GET http://localhost:5000/api/test-results/course/course-uuid-here/statistics \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "X-API-Key: YOUR_API_KEY"
```

## ⏰ Автоматический импорт

### Настройка расписания импорта

```javascript
const testImportScheduler = require('./services/testImportScheduler');

// Инициализация (в server.js)
await testImportScheduler.initialize();

// Добавление расписания
await testImportScheduler.addSchedule(
  'course-uuid',    // ID курса
  1,               // Часть теста (любое положительное число)
  'sheet-id',      // ID Google Sheets
  '0 */2 * * *'    // Каждые 2 часа
);
```

### Примеры Cron расписаний:
- `0 */1 * * *` - каждый час
- `0 */2 * * *` - каждые 2 часа  
- `0 9 * * *` - каждый день в 9:00
- `0 9 * * 1` - каждый понедельник в 9:00

## 🧩 Гибкость системы

### Количество частей теста
Система автоматически адаптируется к любому количеству частей теста:
- **1 часть:** Простой тест без деления
- **2 части:** Как в примере заказчицы (часть 1 + часть 2)
- **3+ части:** Система поддерживает любое количество частей

Для каждой части создается отдельная запись в БД с указанием номера части.

### Определение завершенности курса
- Система динамически определяет общее количество частей на основе существующих результатов
- Курс считается пройденным, когда пользователь сдал все существующие части с проходным баллом

## 🔧 Troubleshooting

### Ошибка: "Email column not found"
**Проблема:** В Google Sheets нет колонки с email.
**Решение:** Убедитесь, что в форме есть обязательное поле email.

### Ошибка: "User not found for email"
**Проблема:** Email из Google Sheets не найден в вашей БД.
**Решение:** Проверьте, что пользователи зарегистрированы с тем же email.

### Ошибка: "The caller does not have permission"
**Проблема:** Сервисный аккаунт не имеет доступа к Google Sheets.
**Решение:** Добавьте `hr-navigator@hr-navigator-461812.iam.gserviceaccount.com` как читателя.

### Ошибка: "Sheet not found"
**Проблема:** Неверный Sheet ID или лист удален.
**Решение:** Проверьте правильность Sheet ID в URL.

### Ошибка: "part must be a positive integer"
**Проблема:** Указан неверный номер части теста.
**Решение:** Используйте положительные числа (1, 2, 3, ...) для номера части.

## 📈 Мониторинг

### Логи импорта
Все операции импорта логируются в `backend/logs/`.

### Проверка статуса планировщика
```javascript
const stats = testImportScheduler.getStats();
console.log(stats);
// { isInitialized: true, activeJobs: 3, jobKeys: ['course1_1', 'course1_2', 'course2_1'] }
```

## 🔐 Безопасность

1. **Не коммитьте credentials** в Git
2. **Используйте RLS** для защиты данных
3. **Проверяйте права доступа** в API эндпоинтах
4. **Логируйте все операции** для аудита

## 📝 Структура Google Sheets

Ожидаемые колонки в Google Sheets:
- **Email** - обязательно (любые варианты: "email", "электронная почта", "e-mail")
- **Баллы** - опционально ("балл", "score", "баллы", "очки")
- **Время** - опционально ("timestamp", "дата", "время", "отметка времени")

Пример структуры:
```
| Отметка времени | Email | ФИО | Балл |
|-----------------|-------|-----|------|
| 2024-01-15 10:30| user@example.com | Иванов И.И. | 85 |
```

## 🎯 Интеграция с уроками

### Добавление теста в урок:
1. Создайте урок с типом `"quiz"` или `"test"`
2. В поле `content_url` добавьте ссылку на Google Form
3. После прохождения теста студентом импортируйте результаты
4. Результаты автоматически привяжутся к пользователю по email

### Типы уроков:
- `"video"` - видео урок
- `"pdf"` - PDF документ
- `"quiz"` - квиз/тест (интерактивный)
- `"test"` - тест (любой формат)

### Автоматическая выдача сертификатов:
Пользователи, набравшие проходной балл (по умолчанию 60%) по всем частям теста, автоматически попадают в список готовых к получению сертификата.

---

**Поддержка:** При возникновении проблем проверьте логи в `backend/logs/` или обратитесь к разработчику.