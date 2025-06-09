# SSL Certificate Setup Instructions

## Шаг 1: Подготовка SSL сертификатов

У вас должны быть следующие файлы SSL сертификатов:
- `hrnavigator_kz.crt` - основной сертификат
- `hrnavigator_kz.ca-bundle` - промежуточные сертификаты  
- `private.key` - приватный ключ

## Шаг 2: Объединение сертификатов

Для правильной работы nginx нужно объединить основной сертификат с ca-bundle:

```bash
# На вашем локальном компьютере выполните:
cat hrnavigator_kz.crt hrnavigator_kz.ca-bundle > hrnavigator_kz_full.crt
```

## Шаг 3: Загрузка сертификатов на сервер

### Вариант A: Использование SCP (рекомендуется)
```bash
# Загрузите объединенный сертификат
scp hrnavigator_kz_full.crt root@185.129.51.245:/etc/ssl/certs/hrnavigator_kz.crt

# Загрузите приватный ключ
scp private.key root@185.129.51.245:/etc/ssl/private/private.key
```

### Вариант B: Ручное создание файлов через SSH

1. Подключитесь к серверу:
```bash
ssh root@185.129.51.245
```

2. Создайте файл сертификата:
```bash
nano /etc/ssl/certs/hrnavigator_kz.crt
```
Скопируйте содержимое объединенного файла (hrnavigator_kz.crt + ca-bundle)

3. Создайте файл приватного ключа:
```bash
nano /etc/ssl/private/private.key
```
Скопируйте содержимое файла private.key

## Шаг 4: Проверка сертификатов

После загрузки проверьте сертификаты:

```bash
# Проверьте содержимое сертификата
openssl x509 -in /etc/ssl/certs/hrnavigator_kz.crt -text -noout

# Проверьте соответствие ключа и сертификата
openssl x509 -noout -modulus -in /etc/ssl/certs/hrnavigator_kz.crt | openssl md5
openssl rsa -noout -modulus -in /etc/ssl/private/private.key | openssl md5
# Выводы должны совпадать
```

## Шаг 5: Установка правильных прав доступа

```bash
chmod 644 /etc/ssl/certs/hrnavigator_kz.crt
chmod 600 /etc/ssl/private/private.key
chown root:root /etc/ssl/certs/hrnavigator_kz.crt
chown root:root /etc/ssl/private/private.key
```

## Примечания

- **Безопасность**: Никогда не передавайте приватный ключ незащищенными каналами
- **Резервная копия**: Сохраните резервные копии всех файлов сертификатов
- **Срок действия**: Сертификат действует до 08.07.2026
- **Домены**: Сертификат покрывает hrnavigator.kz и www.hrnavigator.kz 