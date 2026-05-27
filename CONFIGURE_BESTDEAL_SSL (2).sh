#!/bin/bash

# Configure Best Deal SSL in Sabito Nginx

set -e

echo "=========================================="
echo "CONFIGURE BEST DEAL SSL IN DOCKER NGINX"
echo "=========================================="
echo ""

cd ~/sabito

# Step 1: Check current nginx config
echo "=== Step 1: Current Nginx Config ==="
cat nginx/conf.d/sabito.conf | head -50

echo ""
echo "=== Step 2: Current SSL Directory ==="
ls -la ssl/

echo ""
echo "=== Step 3: Best Deal SSL Certificates ==="
ls -la /etc/letsencrypt/live/bestdealshippingapp.com/*.pem

echo ""
echo "=== Step 4: Backup Current Config ==="
cp nginx/conf.d/sabito.conf nginx/conf.d/sabito.conf.backup.$(date +%Y%m%d)
echo "✓ Backup created"

echo ""
echo "=== Step 5: Copy Best Deal SSL Certificates ==="
# Copy certificates to sabito ssl directory
cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem ssl/bestdealshippingapp.com.crt
cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem ssl/bestdealshippingapp.com.key

chmod 644 ssl/bestdealshippingapp.com.crt
chmod 600 ssl/bestdealshippingapp.com.key

echo "✓ Certificates copied"
ls -la ssl/ | grep bestdeal

echo ""
echo "=== Step 6: Check Docker Compose or Run Command ==="
# Need to check how nginx container is started to see if we need to update volumes

echo ""
echo -e "${GREEN}=========================================="
echo "NEXT STEPS:"
echo "==========================================${NC}"
echo ""
echo "1. Review current nginx config (shown above)"
echo "2. Add Best Deal domain configuration to nginx/conf.d/sabito.conf"
echo "3. Restart sabito-nginx container to apply changes"
echo ""


