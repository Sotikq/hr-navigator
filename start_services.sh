#!/bin/bash

# HR Navigator Services Setup Script
echo "🔧 Finalizing HR Navigator deployment..."

# Set correct permissions
echo "🔐 Setting file permissions..."
chown -R www-data:www-data /var/www/hrnavigator
chmod -R 755 /var/www/hrnavigator

# Set SSL certificate permissions
chmod 600 /etc/ssl/private/private.key
chmod 644 /etc/ssl/certs/hrnavigator_kz.crt

# Enable nginx site
echo "🌐 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/hrnavigator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration error!"
    exit 1
fi

# Restart nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Start backend with PM2
echo "🚀 Starting backend application..."
cd /var/www/hrnavigator/backend

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'hr-navigator-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/hr-navigator-error.log',
    out_file: '/var/log/pm2/hr-navigator-out.log',
    log_file: '/var/log/pm2/hr-navigator.log',
    time: true
  }]
};
EOF

# Create log directory
mkdir -p /var/log/pm2

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Deployment completed!"
echo ""
echo "🌐 Your application should now be available at:"
echo "   https://hrnavigator.kz"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status              - Check application status"
echo "   pm2 logs hr-navigator-backend  - View application logs"
echo "   pm2 restart hr-navigator-backend  - Restart application"
echo "   systemctl status nginx  - Check Nginx status"
echo "   nginx -t               - Test Nginx configuration"
echo ""
echo "🔍 Troubleshooting:"
echo "   tail -f /var/log/nginx/error.log  - Nginx error logs"
echo "   tail -f /var/log/pm2/hr-navigator.log  - Application logs" 