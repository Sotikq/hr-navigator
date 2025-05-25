FROM node:18

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm rebuild sharp

COPY . .

RUN mkdir -p uploads/reviews public logs
RUN chmod -R 755 uploads public logs

EXPOSE 5000

CMD ["npm", "start"]