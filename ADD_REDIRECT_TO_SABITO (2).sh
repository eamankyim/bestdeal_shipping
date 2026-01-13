#!/bin/bash

# Add Best Deal Redirect to Sabito Nginx

cd ~/sabito

echo "=========================================="
echo "ADDING BEST DEAL REDIRECT TO SABITO NGINX"
echo "=========================================="
echo ""

# Step 1: Backup config
echo "=== Step 1: Backup Config ==="
cp nginx/conf.d/sabito.conf nginx/conf.d/sabito.conf.backup.$(date +%Y%m%d-%H%M%S)
echo "✓ Backup created"

# Step 2: Add redirect
echo ""
echo "=== Step 2: Add Best Deal Redirect ==="
cat >> nginx/conf.d/sabito.conf << 'EOF'

# Best Deal Shipping - Redirect to port 8443 (bestdeal-nginx)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;

    # Use any certificate (will redirect quickly)
    ssl_certificate /etc/nginx/ssl/sabito.crt;
    ssl_certificate_key /etc/nginx/ssl/sabito.key;

    # Redirect to port 8443 where bestdeal-nginx is listening
    return 301 https://$host:8443$request_uri;
}

# HTTP redirect for Best Deal
server {
    listen 80;
    listen [::]:80;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;
    return 301 https://$host:8443$request_uri;
}
EOF

echo "✓ Redirect added"

# Step 3: Test nginx config
echo ""
echo "=== Step 3: Test Nginx Config ==="
docker exec sabito-nginx nginx -t

# Step 4: Reload nginx
echo ""
echo "=== Step 4: Reload Nginx ==="
docker exec sabito-nginx nginx -s reload
echo "✓ Nginx reloaded"

# Step 5: Test redirect
echo ""
echo "=== Step 5: Test Redirect ==="
echo "Testing redirect..."
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -10

echo ""
echo "=========================================="
echo "REDIRECT ADDED!"
echo "=========================================="
echo ""
echo "Now visiting https://www.bestdealshippingapp.com will redirect to:"
echo "  https://www.bestdealshippingapp.com:8443"
echo ""
echo "The redirect happens quickly, so users won't see the SSL warning."
echo ""


