#!/bin/bash

# Find Nginx Configuration in Docker Container

echo "=========================================="
echo "FIND NGINX CONFIGURATION"
echo "=========================================="
echo ""

# Step 1: Find nginx config files in container
echo "=== Step 1: Finding Nginx Config Files ==="
docker exec sabito-nginx find /etc/nginx -name "*.conf" -type f 2>/dev/null

echo ""
echo "=== Step 2: Check Main Nginx Config ==="
docker exec sabito-nginx cat /etc/nginx/nginx.conf 2>/dev/null | head -30

echo ""
echo "=== Step 3: List All Config Directories ==="
docker exec sabito-nginx ls -la /etc/nginx/ 2>/dev/null

echo ""
echo "=== Step 4: Check Sites-Available/Enabled ==="
docker exec sabito-nginx ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled"
docker exec sabito-nginx ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "No sites-available"

echo ""
echo "=== Step 5: Check Docker Compose Volumes ==="
cd ~/sabito
cat docker-compose.yml | grep -A20 "nginx:" | grep -E "image:|volumes:|ports:|command:" || echo "Need to check docker-compose.yml"

echo ""
echo "=== Step 6: Check All Container Volumes ==="
docker inspect sabito-nginx | grep -A20 '"Mounts"' | grep -E "Source|Destination" | head -10

echo ""
echo "=== Step 7: Check Certificate Files ==="
ls -la /etc/letsencrypt/live/bestdealshippingapp.com/ 2>/dev/null || echo "Certificates not found"


