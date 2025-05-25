# Используем Node.js 18 на базе Debian (glibc)
FROM node:18

# Устанавливаем необходимые системные зависимости
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN mkdir -p uploads/reviews public logs
RUN chmod -R 755 uploads public logs

EXPOSE 3000

CMD ["npm", "start"]