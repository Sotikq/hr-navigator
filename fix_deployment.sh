#!/bin/bash

# Fix HR Navigator Deployment Script
echo "🔧 Fixing HR Navigator deployment..."

# Update DNS A-record to point to VPS
echo "📋 DNS Changes Required:"
echo "Change hrnavigator.kz A-record from 89.35.125.12 to 185.129.51.245"
echo "Change www.hrnavigator.kz A-record from 89.35.125.12 to 185.129.51.245"
echo ""

# Ensure we're in the right directory
cd /var/www/hrnavigator

# Update backend .env to use the main domain
echo "⚙️ Updating backend configuration..."
cat > backend/.env << 'EOF'
PORT=5000
DATABASE_URL=postgresql://postgres.uppjtvxypgfajxjbzjmp:CzaU4S-@!h6i+RN@aws-0-eu-north-1.pooler.supabase.com:5432/postgres
JWT_SECRET=supersecretkey
API_KEY=super_secure_key_987
FRONTEND_URL=https://hrnavigator.kz/
NODE_ENV=production
EOF

# Update nginx configuration for proper domain routing
echo "🌐 Updating Nginx configuration..."
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

    # Main Angular application
    root /var/www/hrnavigator/frontend/dist/hr;
    index index.html;

    # Handle Angular routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # API routes to backend
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
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://hrnavigator.kz" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://hrnavigator.kz";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }

    # Handle file uploads and static files from backend
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Documentation
    location /api-docs/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_Set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/api/healthz;
        proxy_set_header Host $host;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
}

# Separate server block for server.hrnavigator.kz (API only)
server {
    listen 80;
    server_name server.hrnavigator.kz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name server.hrnavigator.kz;

    # Same SSL configuration
    ssl_certificate /etc/ssl/certs/hrnavigator_kz.crt;
    ssl_certificate_key /etc/ssl/private/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # Direct API access for development/testing
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Update frontend configuration for production
echo "🔧 Updating frontend configuration..."
cd frontend

# Check if angular.json exists and update base href
if [ -f "angular.json" ]; then
    # Update base href in angular.json for production
    sed -i 's/"baseHref": "[^"]*"/"baseHref": "\/"/' angular.json
fi

# Rebuild frontend with correct configuration
echo "🏗️ Rebuilding frontend..."
npm run build

# Update backend CORS configuration
echo "⚙️ Updating backend CORS..."
cd ../backend

# Create a backup of current config
cp config/cors.js config/cors.js.backup 2>/dev/null || true

# Update CORS to allow the main domain
cat > config/cors.js << 'EOF'
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://hrnavigator.kz',
    'https://www.hrnavigator.kz',
    'http://localhost:4200', // for development
    'https://hr-navigator.netlify.app' // legacy
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'DNT',
    'If-Modified-Since',
    'Keep-Alive',
    'User-Agent'
  ]
};

module.exports = cors(corsOptions);
EOF

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    systemctl reload nginx
    
    # Restart backend with updated configuration
    pm2 restart hr-navigator-backend
    
    echo "✅ Services updated successfully!"
    echo ""
    echo "📋 Manual steps required:"
    echo "1. Update DNS records in your domain panel:"
    echo "   hrnavigator.kz A -> 185.129.51.245"
    echo "   www.hrnavigator.kz A -> 185.129.51.245"
    echo ""
    echo "2. Wait 5-10 minutes for DNS propagation"
    echo ""
    echo "3. Test the website:"
    echo "   https://hrnavigator.kz"
    echo "   https://hrnavigator.kz/api/healthz"
    echo "   https://hrnavigator.kz/api-docs"
    
else
    echo "❌ Nginx configuration error!"
    echo "Please check the configuration manually"
    exit 1
fi 