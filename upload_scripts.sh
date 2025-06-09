#!/bin/bash

# Script to upload all deployment files to the server
echo "📤 Uploading deployment files to server..."

SERVER="root@185.129.51.245"

# Upload main deployment scripts
echo "Uploading deployment scripts..."
scp deployment_script.sh $SERVER:/tmp/
scp start_services.sh $SERVER:/tmp/

# Upload SSL setup instructions
echo "Uploading documentation..."
scp ssl_setup_instructions.md $SERVER:/tmp/
scp DEPLOYMENT_GUIDE.md $SERVER:/tmp/

echo "✅ All files uploaded successfully!"
echo ""
echo "🔄 Next steps:"
echo "1. SSH to your server: ssh $SERVER"
echo "2. Move scripts to working directory:"
echo "   mv /tmp/deployment_script.sh /tmp/start_services.sh /root/"
echo "   chmod +x /root/deployment_script.sh /root/start_services.sh"
echo "3. Run deployment: cd /root && ./deployment_script.sh"
echo "4. After SSL setup: ./start_services.sh" 