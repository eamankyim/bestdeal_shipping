#!/bin/bash

# Check Nginx Configuration for Best Deal

echo "=========================================="
echo "CHECKING NGINX CONFIGURATION FOR BEST DEAL"
echo "=========================================="
echo ""

# Step 1: Check Best Deal server block
echo "=== Step 1: Best Deal Server Block ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -B5 -A40 "server_name.*bestdealshippingapp.com"

echo ""

# Step 2: Check all server blocks
echo "=== Step 2: All Server Blocks ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -E "server_name|listen.*443|ssl_certificate" | head -30

echo ""

# Step 3: Check default server block
echo "=== Step 3: Default Server Block ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -B5 -A20 "server_name.*sabito.app\|default_server" | head -30

echo ""

# Step 4: Check certificate files
echo "=== Step 4: Certificate Files ==="
docker exec sabito-nginx ls -la /etc/nginx/ssl/ | grep -E "bestdeal|sabito"

echo ""
echo "=========================================="


