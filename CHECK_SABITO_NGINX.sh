#!/bin/bash

# Check Sabito Nginx Configuration

echo "=========================================="
echo "CHECK SABITO NGINX SETUP"
echo "=========================================="
echo ""

# Find nginx config
echo "=== Finding Nginx Config Files ==="
docker exec sabito-nginx find /etc/nginx -name "*.conf" -type f 2>/dev/null

echo ""
echo "=== Main Nginx Config ==="
docker exec sabito-nginx cat /etc/nginx/nginx.conf 2>/dev/null | grep -E "include|conf.d|sites-enabled" | head -10

echo ""
echo "=== All Config Files ==="
docker exec sabito-nginx ls -laR /etc/nginx/ 2>/dev/null | grep -E "\.conf$|sites-|conf.d" | head -20

echo ""
echo "=== Docker Compose Nginx Service ==="
cd ~/sabito
if [ -f docker-compose.yml ]; then
    cat docker-compose.yml | grep -A30 "nginx:" | head -40
else
    echo "docker-compose.yml not found"
fi

echo ""
echo "=== Container Volumes ==="
docker inspect sabito-nginx --format='{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' 2>/dev/null | head -10

echo ""
echo "=== SSL Certificates ==="
ls -la /etc/letsencrypt/live/bestdealshippingapp.com/ 2>/dev/null && echo "✓ Certificates found" || echo "✗ Certificates not found"


