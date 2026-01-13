#!/bin/bash

# Add Best Deal Server Block to Nginx Config

set -e

echo "=========================================="
echo "ADDING BEST DEAL SERVER BLOCK TO NGINX"
echo "=========================================="
echo ""

cd ~/sabito

# Step 1: Backup config
echo "=== Step 1: Backup Config ==="
cp nginx/conf.d/sabito.conf nginx/conf.d/sabito.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Step 2: Check if Best Deal block already exists
echo ""
echo "=== Step 2: Check if Best Deal Block Exists ==="
if grep -q "server_name.*bestdealshippingapp.com" nginx/conf.d/sabito.conf; then
    echo "⚠ Best Deal server block already exists!"
    echo "Checking current configuration:"
    grep -B5 -A30 "server_name.*bestdealshippingapp.com" nginx/conf.d/sabito.conf
    exit 1
else
    echo "✓ Best Deal server block not found - will add it"
fi

# Step 3: Add Best Deal server block
echo ""
echo "=== Step 3: Add Best Deal Server Block ==="

# Create the server block configuration
cat >> nginx/conf.d/sabito.conf << 'EOF'

# Best Deal Shipping Application
server {
    listen 443 ssl http2;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;

    ssl_certificate /etc/nginx/ssl/bestdealshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/bestdealshippingapp.com.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React App)
    location / {
        proxy_pass http://172.17.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://172.17.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect for Best Deal
server {
    listen 80;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;
    return 301 https://$host$request_uri;
}
EOF

echo "✓ Best Deal server block added"

# Step 4: Verify config syntax
echo ""
echo "=== Step 4: Verify Config Syntax ==="
docker exec sabito-nginx nginx -t

echo ""
echo "=========================================="
echo "BEST DEAL SERVER BLOCK ADDED!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Reload nginx: docker exec sabito-nginx nginx -s reload"
echo "2. Test in browser: https://www.bestdealshippingapp.com"
echo ""


