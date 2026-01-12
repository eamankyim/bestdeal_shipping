#!/bin/bash

# Test Services Response

echo "=========================================="
echo "TESTING SERVICES RESPONSE"
echo "=========================================="
echo ""

# Step 1: Test Frontend
echo "=== Step 1: Test Frontend (port 3000) ==="
curl -I http://localhost:3000 2>&1 | head -10 || echo "Frontend not responding!"

echo ""

# Step 2: Test Backend
echo "=== Step 2: Test Backend (port 4001) ==="
curl -I http://localhost:4001 2>&1 | head -10 || echo "Backend not responding!"

echo ""

# Step 3: Test Nginx
echo "=== Step 3: Test Nginx (port 80) ==="
curl -I http://localhost 2>&1 | head -10 || echo "Nginx not responding!"

echo ""

# Step 4: Test Nginx Proxy to Frontend
echo "=== Step 4: Test Nginx Proxy to Frontend ==="
docker exec sabito-nginx wget -O- -T 5 http://172.17.0.1:3000 2>&1 | head -10 || echo "Cannot reach frontend from nginx!"

echo ""

# Step 5: Test Nginx Proxy to Backend
echo "=== Step 5: Test Nginx Proxy to Backend ==="
docker exec sabito-nginx wget -O- -T 5 http://172.17.0.1:4001 2>&1 | head -10 || echo "Cannot reach backend from nginx!"

echo ""

# Step 6: Check Best Deal Nginx Config
echo "=== Step 6: Check Best Deal Nginx Config ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -A30 "server_name.*bestdealshippingapp.com" | head -35

echo ""

# Step 7: Check Nginx Logs
echo "=== Step 7: Nginx Error Logs (Last 20 lines) ==="
docker logs sabito-nginx 2>&1 | tail -20 | grep -i "error\|warn\|bestdeal" || echo "No errors found"

echo ""
echo "=========================================="


