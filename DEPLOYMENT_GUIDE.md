# 🚀 HR Navigator - Полная инструкция по развертыванию

## 📋 Обзор инфраструктуры

**Домен**: hrnavigator.kz  
**Сервер**: 185.129.51.245 (server.hrnavigator.kz)  
**OS**: Ubuntu 22.04  
**SSH**: root / M~fHs!42aFT5  
**SSL**: Действует до 08.07.2026  

## 🛠️ Шаг 1: Подготовка SSL сертификатов

1. **Объедините файлы сертификатов** (на вашем локальном ПК):
```bash
cat hrnavigator_kz.crt hrnavigator_kz.ca-bundle > hrnavigator_kz_full.crt
```

2. **Загрузите сертификаты на сервер**:
```bash
scp hrnavigator_kz_full.crt root@185.129.51.245:/tmp/
scp private.key root@185.129.51.245:/tmp/
```

## 🌐 Шаг 2: Развертывание приложения

1. **Подключитесь к серверу**:
```bash
ssh root@185.129.51.245
# Пароль: M~fHs!42aFT5
```

2. **Загрузите и запустите скрипт развертывания**:
```bash
# Скачайте скрипты развертывания
wget -O deployment_script.sh https://raw.githubusercontent.com/your-repo/deployment_script.sh
wget -O start_services.sh https://raw.githubusercontent.com/your-repo/start_services.sh

# Сделайте скрипты исполняемыми
chmod +x deployment_script.sh start_services.sh

# Запустите основное развертывание
./deployment_script.sh
```

3. **Установите SSL сертификаты**:
```bash
# Переместите сертификаты в правильные папки
mkdir -p /etc/ssl/certs /etc/ssl/private
mv /tmp/hrnavigator_kz_full.crt /etc/ssl/certs/hrnavigator_kz.crt
mv /tmp/private.key /etc/ssl/private/private.key

# Установите правильные права доступа
chmod 644 /etc/ssl/certs/hrnavigator_kz.crt
chmod 600 /etc/ssl/private/private.key
```

4. **Запустите сервисы**:
```bash
./start_services.sh
```

## ✅ Шаг 3: Проверка развертывания

1. **Проверьте статус сервисов**:
```bash
# Проверьте Nginx
systemctl status nginx
nginx -t

# Проверьте приложение
pm2 status
pm2 logs hr-navigator-backend --lines 50
```

2. **Проверьте подключение к базе данных**:
```bash
cd /var/www/hrnavigator/backend
node testConnection.js
```

3. **Откройте сайт в браузере**:
- https://hrnavigator.kz
- https://hrnavigator.kz/api-docs (документация API)

## 🔍 Диагностика и устранение неполадок

### Проблемы с SSL
```bash
# Проверьте сертификаты
openssl x509 -in /etc/ssl/certs/hrnavigator_kz.crt -text -noout
openssl x509 -noout -modulus -in /etc/ssl/certs/hrnavigator_kz.crt | openssl md5
openssl rsa -noout -modulus -in /etc/ssl/private/private.key | openssl md5

# Тест SSL соединения
openssl s_client -connect hrnavigator.kz:443
```

### Проблемы с Nginx
```bash
# Проверьте конфигурацию
nginx -t

# Просмотрите логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Проблемы с приложением
```bash
# Просмотрите логи приложения
pm2 logs hr-navigator-backend

# Перезапустите приложение
pm2 restart hr-navigator-backend

# Проверьте использование ресурсов
pm2 monit
```

### Проблемы с базой данных
```bash
# Проверьте подключение
cd /var/www/hrnavigator/backend
node -e "
const pool = require('./config/db');
pool.query('SELECT 1', (err, res) => {
  if (err) console.error('Error:', err);
  else console.log('Database connected successfully');
  process.exit();
});
"
```

## 📊 Полезные команды

### Управление PM2
```bash
pm2 status                           # Статус приложений
pm2 logs hr-navigator-backend        # Просмотр логов
pm2 restart hr-navigator-backend     # Перезапуск
pm2 reload hr-navigator-backend      # Плавная перезагрузка
pm2 stop hr-navigator-backend        # Остановка
pm2 delete hr-navigator-backend      # Удаление из PM2
pm2 save                             # Сохранение текущего состояния
pm2 startup                          # Автозапуск при перезагрузке
```

### Управление Nginx
```bash
systemctl status nginx              # Статус Nginx
systemctl restart nginx             # Перезапуск Nginx
systemctl reload nginx              # Перезагрузка конфигурации
nginx -t                            # Тест конфигурации
```

### Мониторинг ресурсов
```bash
htop                               # Мониторинг системы
df -h                              # Использование диска
free -h                            # Использование памяти
netstat -tulpn | grep :443         # Проверка портов
```

## 🔄 Обновление приложения

```bash
cd /var/www/hrnavigator

# Сохраните изменения (если есть)
git stash

# Получите последние изменения
git pull origin main

# Обновите зависимости backend
cd backend
npm install --production

# Обновите и пересоберите frontend
cd ../frontend
npm install
npm run build

# Перезапустите приложение
pm2 restart hr-navigator-backend

# Перезагрузите Nginx
systemctl reload nginx
```

## 🛡️ Безопасность

### Регулярные задачи безопасности
```bash
# Обновление системы
apt update && apt upgrade -y

# Проверка логов на подозрительную активность
tail -f /var/log/nginx/access.log | grep -E "POST|PUT|DELETE"

# Резервное копирование
tar -czf /root/backup_$(date +%Y%m%d).tar.gz /var/www/hrnavigator
```

### Мониторинг SSL сертификата
```bash
# Проверка срока действия сертификата
openssl x509 -in /etc/ssl/certs/hrnavigator_kz.crt -noout -dates
```

## 📈 Мониторинг производительности

```bash
# Статистика использования Nginx
tail -f /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr

# Мониторинг PM2
pm2 monit

# Статистика базы данных (через приложение)
curl -k https://hrnavigator.kz/api/healthz
```

## 🆘 Контакты для поддержки

- **Email**: admin@hrnavigator.kz
- **Домен до**: 08.06.2026
- **SSL до**: 08.07.2026
- **VPS**: Astana, Kazakhstan

---

**✨ Поздравляем! HR Navigator успешно развернут и готов к работе!** 