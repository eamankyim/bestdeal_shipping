#!/bin/bash

# Add Best Deal Domain Configuration to Nginx

set -e

cd ~/sabito

echo "=========================================="
echo "ADDING BEST DEAL DOMAIN CONFIGURATION"
echo "=========================================="
echo ""

# Backup
cp nginx/conf.d/sabito.conf nginx/conf.d/sabito.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Check if Best Deal config already exists
if grep -q "bestdealshippingapp.com" nginx/conf.d/sabito.conf; then
    echo "⚠ Best Deal configuration already exists!"
    exit 1
fi

# Add Best Deal configuration to the end of sabito.conf
cat >> nginx/conf.d/sabito.conf << 'EOF'

# ============================================================================
# Best Deal Shipping App (bestdealshippingapp.com, www.bestdealshippingapp.com)
# ============================================================================
server {
    listen 443 ssl http2;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/bestdealshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/bestdealshippingapp.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API
    location /api {
        proxy_pass http://host.docker.internal:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Frontend application
    location / {
        proxy_pass http://host.docker.internal:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        proxy_pass http://host.docker.internal:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✓ Best Deal configuration added to sabito.conf"
echo ""
echo "Updated config (last 50 lines):"
tail -50 nginx/conf.d/sabito.conf

echo ""
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo "1. Test nginx config: docker exec sabito-nginx nginx -t"
echo "2. Reload nginx: docker restart sabito-nginx"
echo "3. Test: curl -I https://www.bestdealshippingapp.com"
echo ""


