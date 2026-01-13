#!/bin/bash
# Quick setup script - copy and paste this entire block to server

<<<<<<< HEAD
cd ~/shipease_shipping && \
mkdir -p nginx/ssl nginx/conf.d && \
cp /etc/letsencrypt/live/shipeaseshippingapp.com/fullchain.pem nginx/ssl/shipeaseshippingapp.com.crt && \
cp /etc/letsencrypt/live/shipeaseshippingapp.com/privkey.pem nginx/ssl/shipeaseshippingapp.com.key && \
chmod 644 nginx/ssl/shipeaseshippingapp.com.crt && \
chmod 600 nginx/ssl/shipeaseshippingapp.com.key && \
=======
cd ~/bestdeal_shipping && \
mkdir -p nginx/ssl nginx/conf.d && \
cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem nginx/ssl/bestdealshippingapp.com.crt && \
cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem nginx/ssl/bestdealshippingapp.com.key && \
chmod 644 nginx/ssl/bestdealshippingapp.com.crt && \
chmod 600 nginx/ssl/bestdealshippingapp.com.key && \
>>>>>>> origin/master
cat > nginx/Dockerfile << 'DOCKERFILEEOF'
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
RUN mkdir -p /etc/nginx/ssl
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILEEOF
cat > nginx/nginx.conf << 'NGINXEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;
events { worker_connections 1024; }
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    log_format main '$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$http_x_forwarded_for"';
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
NGINXEOF
<<<<<<< HEAD
cat > nginx/conf.d/shipease.conf << 'CONFEOF'
server {
    listen 80;
    listen [::]:80;
    server_name shipeaseshippingapp.com www.shipeaseshippingapp.com;
=======
cat > nginx/conf.d/bestdeal.conf << 'CONFEOF'
server {
    listen 80;
    listen [::]:80;
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;
>>>>>>> origin/master
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
<<<<<<< HEAD
    server_name shipeaseshippingapp.com www.shipeaseshippingapp.com;
    ssl_certificate /etc/nginx/ssl/shipeaseshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/shipeaseshippingapp.com.key;
=======
    server_name bestdealshippingapp.com www.bestdealshippingapp.com;
    ssl_certificate /etc/nginx/ssl/bestdealshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/bestdealshippingapp.com.key;
>>>>>>> origin/master
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5:!RC4:!3DES;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
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
        proxy_cache_bypass $http_upgrade;
    }
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
    }
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
CONFEOF
cp docker-compose.prod.yml docker-compose.prod.yml.backup && \
<<<<<<< HEAD
if ! grep -q "shipease_nginx" docker-compose.prod.yml; then
    sed -i '/^volumes:$/i\  nginx:\n    build:\n      context: ./nginx\n      dockerfile: Dockerfile\n    container_name: shipease_nginx\n    restart: unless-stopped\n    ports:\n      - "${NGINX_HTTP_PORT:-8080}:80"\n      - "${NGINX_HTTPS_PORT:-8443}:443"\n    volumes:\n      - ./nginx/ssl:/etc/nginx/ssl:ro\n    depends_on:\n      - frontend\n      - backend\n    networks:\n      - shipease_network\n' docker-compose.prod.yml
=======
if ! grep -q "bestdeal_nginx" docker-compose.prod.yml; then
    sed -i '/^volumes:$/i\  nginx:\n    build:\n      context: ./nginx\n      dockerfile: Dockerfile\n    container_name: bestdeal_nginx\n    restart: unless-stopped\n    ports:\n      - "${NGINX_HTTP_PORT:-8080}:80"\n      - "${NGINX_HTTPS_PORT:-8443}:443"\n    volumes:\n      - ./nginx/ssl:/etc/nginx/ssl:ro\n    depends_on:\n      - frontend\n      - backend\n    networks:\n      - bestdeal_network\n' docker-compose.prod.yml
>>>>>>> origin/master
fi && \
docker-compose -f docker-compose.prod.yml build nginx && \
docker-compose -f docker-compose.prod.yml up -d nginx && \
sleep 3 && \
<<<<<<< HEAD
docker ps | grep shipease_nginx && \
docker exec shipease_nginx nginx -t && \
=======
docker ps | grep bestdeal_nginx && \
docker exec bestdeal_nginx nginx -t && \
>>>>>>> origin/master
echo "✓ Best Deal nginx container is running on test ports 8080/8443"


