# 🚨 Быстрое исправление HR Navigator

## 🔍 Проблема
- Фронтенд на Plesk хостинге (89.35.125.12)
- Backend на VPS сервере (185.129.51.245) 
- DNS записи указывают на Plesk, но нужно на VPS
- Изображения не загружаются, CORS ошибки

## ✅ Решение: Перенести всё на VPS

### Шаг 1: Изменить DNS записи

**🌐 В панели управления доменом измените:**

```
Старые записи:
hrnavigator.kz        A    89.35.125.12
www.hrnavigator.kz    A    89.35.125.12

Новые записи:
hrnavigator.kz        A    185.129.51.245
www.hrnavigator.kz    A    185.129.51.245
```

**server.hrnavigator.kz оставьте как есть (185.129.51.245)**

### Шаг 2: Загрузить и запустить скрипт исправления

**На VPS сервере выполните:**

```bash
# Подключитесь к серверу
ssh root@185.129.51.245

# Загрузите скрипт исправления
wget -O fix_deployment.sh https://raw.githubusercontent.com/your-files/fix_deployment.sh
# Или скопируйте содержимое файла fix_deployment.sh вручную

# Сделайте исполняемым и запустите
chmod +x fix_deployment.sh
./fix_deployment.sh
```

### Шаг 3: Проверка результата

**Через 5-10 минут после изменения DNS:**

```bash
# Проверьте DNS
nslookup hrnavigator.kz

# Проверьте сайт
curl -I https://hrnavigator.kz
curl -I https://hrnavigator.kz/api/healthz
```

## 🎯 Результат после исправления:

### ✅ Правильная архитектура:
- **https://hrnavigator.kz** → Angular приложение + API (VPS)
- **https://server.hrnavigator.kz** → Прямой доступ к API (VPS)

### ✅ Исправления:
1. **DNS** указывает на VPS
2. **Nginx** настроен для SPA маршрутизации
3. **CORS** настроен правильно
4. **Статические файлы** (изображения) работают
5. **API** доступно через `/api/`

## 🔧 Что делает скрипт:

1. ✅ Обновляет конфигурацию Nginx
2. ✅ Исправляет CORS в backend
3. ✅ Пересобирает frontend для продакшена
4. ✅ Настраивает правильную маршрутизацию
5. ✅ Перезапускает сервисы

## 📱 Тестирование:

После выполнения должно работать:

- **https://hrnavigator.kz** - главная страница Angular
- **https://hrnavigator.kz/api-docs** - документация API
- **https://hrnavigator.kz/api/healthz** - статус API
- **Изображения и стили** должны загружаться

## ⚠️ Если что-то не работает:

### Проблема: DNS ещё не обновился
```bash
# Проверьте DNS
nslookup hrnavigator.kz
# Должен показать 185.129.51.245
```

### Проблема: Nginx ошибки
```bash
# Проверьте логи
tail -f /var/log/nginx/error.log
nginx -t
```

### Проблема: Backend не работает
```bash
# Проверьте PM2
pm2 status
pm2 logs hr-navigator-backend
```

### Проблема: Frontend не показывается
```bash
# Проверьте файлы
ls -la /var/www/hrnavigator/frontend/dist/hr/
```

## 📞 Если нужна помощь:

1. Покажите вывод команды `nginx -t`
2. Покажите логи: `pm2 logs hr-navigator-backend`
3. Проверьте DNS: `nslookup hrnavigator.kz`

---

**🎉 После исправления у вас будет полностью рабочий сайт на https://hrnavigator.kz!** 