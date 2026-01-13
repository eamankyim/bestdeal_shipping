#!/bin/bash

# Complete Host-Level Nginx Router Setup

set -e

echo "=========================================="
echo "SETTING UP HOST-LEVEL NGINX ROUTER"
echo "=========================================="
echo ""

# Step 1: Create directory structure
echo "=== Step 1: Create Directory Structure ==="
mkdir -p ~/host-nginx/ssl ~/host-nginx/conf.d
echo "✓ Directories created"

# Step 2: Copy SSL certificates
echo ""
echo "=== Step 2: Copy SSL Certificates ==="
cp /etc/letsencrypt/live/sabito.app/fullchain.pem ~/host-nginx/ssl/sabito.crt
cp /etc/letsencrypt/live/sabito.app/privkey.pem ~/host-nginx/ssl/sabito.key
cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem ~/host-nginx/ssl/bestdealshippingapp.com.crt
cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem ~/host-nginx/ssl/bestdealshippingapp.com.key
chmod 644 ~/host-nginx/ssl/*.crt
chmod 600 ~/host-nginx/ssl/*.key
echo "✓ SSL certificates copied"

# Step 3: Create nginx configuration
echo ""
echo "=== Step 3: Create Nginx Configuration ==="
cd ~/host-nginx

# Main nginx.conf
cat > nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Router configuration
cat > conf.d/router.conf << 'EOF'
# Sabito Application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sabito.app www.sabito.app api.sabito.app app.sabito.app;

    ssl_certificate /etc/nginx/ssl/sabito.crt;
    ssl_certificate_key /etc/nginx/ssl/sabito.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5:!RC4:!3DES;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://sabito-nginx:8444;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}

# Best Deal Application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;

    ssl_certificate /etc/nginx/ssl/bestdealshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/bestdealshippingapp.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5:!RC4:!3DES;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://bestdeal-nginx:8445;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

    location /api {
        proxy_pass http://bestdeal-nginx:8445;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP redirects
server {
    listen 80;
    listen [::]:80;
    server_name sabito.app www.sabito.app api.sabito.app app.sabito.app;
    return 301 https://$host$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;
    return 301 https://$host$request_uri;
}
EOF

echo "✓ Nginx configuration created"

# Step 4: Create docker-compose.yml
echo ""
echo "=== Step 4: Create Docker Compose ==="
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  host-nginx:
    image: nginx:alpine
    container_name: host-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - host-network

networks:
  host-network:
    driver: bridge
EOF

echo "✓ Docker compose created"

echo ""
echo "=========================================="
echo "HOST NGINX CONFIGURATION CREATED"
echo "=========================================="
echo ""
echo "Next: Update service nginx ports and start host nginx"
echo ""


