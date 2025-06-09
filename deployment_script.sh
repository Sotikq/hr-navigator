#!/bin/bash

# HR Navigator Deployment Script
echo "🚀 Starting HR Navigator deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install additional dependencies
echo "📦 Installing additional packages..."
apt install -y nginx git curl ufw

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Configure firewall
echo "🔐 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/hrnavigator
cd /var/www/hrnavigator

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/Sotikq/hr-navigator.git .

# Create .env file for backend
echo "⚙️ Creating environment configuration..."
cat > backend/.env << 'EOF'
PORT=5000
DATABASE_URL=postgresql://postgres.uppjtvxypgfajxjbzjmp:CzaU4S-@!h6i+RN@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
JWT_SECRET=supersecretkey
API_KEY=super_secure_key_987
FRONTEND_URL=https://hrnavigator.kz/
EOF

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend for production
echo "🏗️ Building frontend..."
npm run build

# Create nginx configuration
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/hrnavigator << 'EOF'
server {
    listen 80;
    server_name hrnavigator.kz www.hrnavigator.kz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hrnavigator.kz www.hrnavigator.kz;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/hrnavigator_kz.crt;
    ssl_certificate_key /etc/ssl/private/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Serve Angular frontend
    root /var/www/hrnavigator/frontend/dist/hr;
    index index.html;

    # Handle Angular routes
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle file uploads
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Handle API docs
    location /api-docs/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

# Create directories for SSL certificates
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

echo "📋 Deployment script created successfully!"
echo ""
echo "🔄 Next steps:"
echo "1. Upload your SSL certificates to the server:"
echo "   - /etc/ssl/certs/hrnavigator_kz.crt"
echo "   - /etc/ssl/private/private.key"
echo ""
echo "2. Run this script: bash deployment_script.sh"
echo ""
echo "3. Configure and start services (see next script)" 