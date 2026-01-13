#!/bin/bash

<<<<<<< HEAD
# Phase 2: Setup ShipEASE Nginx Container
# This script creates the ShipEASE nginx container in isolation (test ports)
=======
# Phase 2: Setup Best Deal Nginx Container
# This script creates the Best Deal nginx container in isolation (test ports)
>>>>>>> origin/master

set -e

echo "=========================================="
echo "PHASE 2: SETUP BEST DEAL NGINX CONTAINER"
echo "=========================================="
echo ""
<<<<<<< HEAD
echo "This will create ShipEASE nginx container on TEST ports (8080/8443)"
echo "No conflicts with existing ports 80/443"
echo ""

cd ~/shipease_shipping
=======
echo "This will create Best Deal nginx container on TEST ports (8080/8443)"
echo "No conflicts with existing ports 80/443"
echo ""

cd ~/bestdeal_shipping
>>>>>>> origin/master

# Step 1: Create directory structure
echo "=== Step 1: Create Directory Structure ==="
mkdir -p nginx/ssl nginx/conf.d
echo "✓ Directories created"

# Step 2: Copy SSL certificates
echo ""
echo "=== Step 2: Copy SSL Certificates ==="
<<<<<<< HEAD
if [ -f /etc/letsencrypt/live/shipeaseshippingapp.com/fullchain.pem ]; then
    cp /etc/letsencrypt/live/shipeaseshippingapp.com/fullchain.pem nginx/ssl/shipeaseshippingapp.com.crt
    cp /etc/letsencrypt/live/shipeaseshippingapp.com/privkey.pem nginx/ssl/shipeaseshippingapp.com.key
    chmod 644 nginx/ssl/shipeaseshippingapp.com.crt
    chmod 600 nginx/ssl/shipeaseshippingapp.com.key
=======
if [ -f /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem ]; then
    cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem nginx/ssl/bestdealshippingapp.com.crt
    cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem nginx/ssl/bestdealshippingapp.com.key
    chmod 644 nginx/ssl/bestdealshippingapp.com.crt
    chmod 600 nginx/ssl/bestdealshippingapp.com.key
>>>>>>> origin/master
    echo "✓ SSL certificates copied"
    ls -la nginx/ssl/
else
    echo "⚠ SSL certificates not found! Creating dummy certificates for testing..."
    echo "You'll need to copy real certificates later"
fi

# Step 3: Create nginx files
echo ""
echo "=== Step 3: Create Nginx Configuration Files ==="

# Create Dockerfile
cat > nginx/Dockerfile << 'EOF'
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificates (will be mounted as volume, but keep structure)
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create main nginx.conf
cat > nginx/nginx.conf << 'EOF'
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
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

<<<<<<< HEAD
# Create ShipEASE server config
cat > nginx/conf.d/shipease.conf << 'EOF'
# ShipEASE Shipping Application
server {
    listen 80;
    listen [::]:80;
    server_name shipeaseshippingapp.com www.shipeaseshippingapp.com;
=======
# Create Best Deal server config
cat > nginx/conf.d/bestdeal.conf << 'EOF'
# Best Deal Shipping Application
server {
    listen 80;
    listen [::]:80;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;
>>>>>>> origin/master
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
<<<<<<< HEAD
    server_name shipeaseshippingapp.com www.shipeaseshippingapp.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/shipeaseshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/shipeaseshippingapp.com.key;
=======
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/bestdealshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/bestdealshippingapp.com.key;
>>>>>>> origin/master

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5:!RC4:!3DES;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Increase timeouts for large requests
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;

    # Frontend (React App) - Proxy to frontend container
    location / {
<<<<<<< HEAD
        proxy_pass http://shipease_frontend:3000;
=======
        proxy_pass http://bestdeal_frontend:3000;
>>>>>>> origin/master
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API - Proxy to backend container
    location /api {
<<<<<<< HEAD
        proxy_pass http://shipease_backend:4001;
=======
        proxy_pass http://bestdeal_backend:4001;
>>>>>>> origin/master
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Increase timeouts for API calls
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo "✓ Nginx configuration files created"

# Step 4: Verify docker-compose has nginx service
echo ""
echo "=== Step 4: Verify Docker Compose Configuration ==="
<<<<<<< HEAD
if grep -q "shipease_nginx" docker-compose.prod.yml; then
=======
if grep -q "bestdeal_nginx" docker-compose.prod.yml; then
>>>>>>> origin/master
    echo "✓ Nginx service already in docker-compose.prod.yml"
else
    echo "⚠ Nginx service not found in docker-compose.prod.yml"
    echo "You'll need to add it manually or update the file"
fi

# Step 5: Build and start nginx
echo ""
echo "=== Step 5: Build and Start Nginx Container ==="
echo "Building nginx container..."
docker-compose -f docker-compose.prod.yml build nginx

echo ""
echo "Starting nginx container..."
docker-compose -f docker-compose.prod.yml up -d nginx

# Step 6: Verify nginx is running
echo ""
echo "=== Step 6: Verify Nginx is Running ==="
sleep 3
<<<<<<< HEAD
if docker ps | grep -q shipease_nginx; then
    echo "✓ shipease_nginx is running"
    docker ps | grep shipease_nginx
else
    echo "✗ shipease_nginx is not running!"
    echo "Checking logs..."
    docker logs shipease_nginx --tail 30
=======
if docker ps | grep -q bestdeal_nginx; then
    echo "✓ bestdeal_nginx is running"
    docker ps | grep bestdeal_nginx
else
    echo "✗ bestdeal_nginx is not running!"
    echo "Checking logs..."
    docker logs bestdeal_nginx --tail 30
>>>>>>> origin/master
    exit 1
fi

# Step 7: Test nginx configuration
echo ""
echo "=== Step 7: Test Nginx Configuration ==="
<<<<<<< HEAD
docker exec shipease_nginx nginx -t
=======
docker exec bestdeal_nginx nginx -t
>>>>>>> origin/master

# Step 8: Test nginx response
echo ""
echo "=== Step 8: Test Nginx Response ==="
echo "Testing HTTP redirect (port 8080)..."
curl -I http://localhost:8080 2>&1 | head -5 || echo "HTTP test failed"

echo ""
echo "Testing HTTPS (port 8443)..."
curl -k -I https://localhost:8443 2>&1 | head -5 || echo "HTTPS test failed"

echo ""
echo "=========================================="
echo "PHASE 2 COMPLETE!"
echo "=========================================="
echo ""
<<<<<<< HEAD
echo "ShipEASE nginx container is running on TEST ports:"
=======
echo "Best Deal nginx container is running on TEST ports:"
>>>>>>> origin/master
echo "  - HTTP:  port 8080"
echo "  - HTTPS: port 8443"
echo ""
echo "Next steps:"
echo "1. Test the nginx container thoroughly"
echo "2. Verify frontend proxy works"
echo "3. Verify backend proxy works"
echo "4. After verification, switch to ports 80/443"
echo ""
echo "Check nginx logs:"
<<<<<<< HEAD
echo "  docker logs shipease_nginx"
=======
echo "  docker logs bestdeal_nginx"
>>>>>>> origin/master
echo ""


