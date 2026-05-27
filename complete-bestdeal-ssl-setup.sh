#!/bin/bash

# Complete Best Deal SSL Setup in Sabito Nginx

set -e

cd ~/sabito

echo "=========================================="
echo "COMPLETE BEST DEAL SSL SETUP"
echo "=========================================="
echo ""

# Step 1: Verify SSL certificates are copied
echo "=== Step 1: Verify SSL Certificates ==="
if [ -f ssl/bestdealshippingapp.com.crt ] && [ -f ssl/bestdealshippingapp.com.key ]; then
    echo "✓ SSL certificates found"
    ls -la ssl/ | grep bestdeal
else
    echo "✗ SSL certificates not found, copying..."
    cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem ssl/bestdealshippingapp.com.crt
    cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem ssl/bestdealshippingapp.com.key
    chmod 644 ssl/bestdealshippingapp.com.crt
    chmod 600 ssl/bestdealshippingapp.com.key
    echo "✓ Certificates copied"
fi

# Step 2: Check if config already has Best Deal
echo ""
echo "=== Step 2: Check Existing Config ==="
if grep -q "bestdealshippingapp.com" nginx/conf.d/sabito.conf; then
    echo "⚠ Best Deal configuration already exists!"
    echo "Current Best Deal config:"
    grep -A30 "bestdealshippingapp.com" nginx/conf.d/sabito.conf | head -35
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping configuration update"
        exit 0
    fi
fi

# Step 3: Backup
echo ""
echo "=== Step 3: Backup Current Config ==="
cp nginx/conf.d/sabito.conf nginx/conf.d/sabito.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Step 4: Add Best Deal configuration
echo ""
echo "=== Step 4: Adding Best Deal Configuration ==="

# Remove existing Best Deal config if present
sed -i '/# ============================================================================$/,$!b;/Best Deal Shipping App/,/# ============================================================================$/{ /# ============================================================================$/d; }' nginx/conf.d/sabito.conf 2>/dev/null || true

# Add new configuration at the end
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

echo "✓ Configuration added"

# Step 5: Test nginx config
echo ""
echo "=== Step 5: Test Nginx Configuration ==="
if docker exec sabito-nginx nginx -t 2>&1; then
    echo "✓ Nginx config is valid"
else
    echo "✗ Nginx config has errors!"
    echo "Rolling back..."
    cp nginx/conf.d/sabito.conf.backup.* nginx/conf.d/sabito.conf 2>/dev/null || echo "Backup not found"
    exit 1
fi

# Step 6: Reload nginx
echo ""
echo "=== Step 6: Reload Nginx ==="
docker restart sabito-nginx
echo "✓ Nginx restarted"

echo ""
echo "=========================================="
echo "SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Test the configuration:"
echo "  curl -I https://www.bestdealshippingapp.com"
echo "  curl -I https://bestdealshippingapp.com"
echo ""


