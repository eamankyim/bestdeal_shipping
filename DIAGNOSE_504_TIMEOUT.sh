#!/bin/bash

# Diagnose 504 Gateway Timeout

cd ~/bestdeal_shipping

echo "=========================================="
echo "DIAGNOSING 504 GATEWAY TIMEOUT"
echo "=========================================="
echo ""

# Step 1: Check container status
echo "=== Step 1: Container Status ==="
echo "All Best Deal containers:"
docker ps | grep bestdeal || echo "No Best Deal containers running!"

echo ""
echo "Frontend container:"
docker ps | grep bestdeal_frontend || echo "✗ Frontend NOT running!"

echo ""
echo "Backend container:"
docker ps | grep bestdeal_backend || echo "✗ Backend NOT running!"

echo ""
echo "Nginx container:"
docker ps | grep bestdeal_nginx || echo "✗ Nginx NOT running!"

# Step 2: Check network
echo ""
echo "=== Step 2: Network Check ==="
echo "Containers on bestdeal_network:"
docker network inspect bestdeal_network | grep -A5 "Containers" | head -20

# Step 3: Test services from host
echo ""
echo "=== Step 3: Test Services from Host ==="
echo "Frontend (port 3000):"
curl -I http://localhost:3000 2>&1 | head -3 || echo "✗ Frontend not responding!"

echo ""
echo "Backend (port 4001):"
curl -I http://localhost:4001 2>&1 | head -3 || echo "✗ Backend not responding!"

# Step 4: Test from nginx container
echo ""
echo "=== Step 4: Test from Nginx Container ==="
echo "Ping frontend:"
docker exec bestdeal_nginx ping -c 2 bestdeal_frontend 2>&1 | head -5 || echo "✗ Cannot ping frontend!"

echo ""
echo "Ping backend:"
docker exec bestdeal_nginx ping -c 2 bestdeal_backend 2>&1 | head -5 || echo "✗ Cannot ping backend!"

echo ""
echo "Test frontend HTTP:"
docker exec bestdeal_nginx wget -O- -T 5 http://bestdeal_frontend:3000 2>&1 | head -10 || echo "✗ Cannot reach frontend!"

echo ""
echo "Test backend HTTP:"
docker exec bestdeal_nginx wget -O- -T 5 http://bestdeal_backend:4001 2>&1 | head -10 || echo "✗ Cannot reach backend!"

# Step 5: Check nginx logs
echo ""
echo "=== Step 5: Nginx Error Logs ==="
docker logs bestdeal_nginx --tail 30 | grep -i "error\|timeout\|upstream\|504" || echo "No errors in logs"

# Step 6: Check nginx config
echo ""
echo "=== Step 6: Nginx Configuration ==="
echo "Checking nginx config for upstream servers:"
docker exec bestdeal_nginx cat /etc/nginx/conf.d/bestdeal.conf | grep -A2 "proxy_pass" || echo "Config not found"

echo ""
echo "=========================================="


