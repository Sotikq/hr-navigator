# Используем Node.js 18 Alpine как базовый образ
FROM node:18-alpine

# Устанавливаем необходимые системные зависимости
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    build-base \
    libc6-compat

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Создаем необходимые директории
RUN mkdir -p uploads/reviews public logs

# Устанавливаем права на директории
RUN chmod -R 755 uploads public logs

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"] 