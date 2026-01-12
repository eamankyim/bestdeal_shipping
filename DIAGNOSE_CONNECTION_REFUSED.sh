#!/bin/bash

# Diagnose Connection Refused Error

echo "=========================================="
echo "DIAGNOSING CONNECTION REFUSED ERROR"
echo "=========================================="
echo ""

# Step 1: Check host-nginx status
echo "=== Step 1: host-nginx Status ==="
if docker ps | grep -q host-nginx; then
    echo "✓ host-nginx is running"
    docker ps | grep host-nginx
else
    echo "✗ host-nginx is NOT running!"
    echo "Checking if container exists (stopped):"
    docker ps -a | grep host-nginx
fi

# Step 2: Check host-nginx logs
echo ""
echo "=== Step 2: host-nginx Logs (Last 30 lines) ==="
docker logs host-nginx --tail 30 2>&1 | tail -20

# Step 3: Check service nginx status
echo ""
echo "=== Step 3: Service Nginx Status ==="
echo "sabito-nginx:"
docker ps | grep sabito-nginx || echo "✗ sabito-nginx not running!"

echo ""
echo "bestdeal-nginx:"
docker ps | grep bestdeal_nginx || echo "✗ bestdeal-nginx not running!"

# Step 4: Check network connectivity
echo ""
echo "=== Step 4: Network Connectivity ==="
echo "Containers on host-network:"
docker network inspect host-network 2>/dev/null | grep -A10 "Containers" | head -20 || echo "⚠ host-network not found!"

echo ""
echo "Testing host-nginx connectivity:"
echo "Ping sabito-nginx:"
docker exec host-nginx ping -c 2 sabito-nginx 2>&1 | head -3 || echo "✗ Cannot reach sabito-nginx"

echo ""
echo "Ping bestdeal-nginx:"
docker exec host-nginx ping -c 2 bestdeal_nginx 2>&1 | head -3 || echo "✗ Cannot reach bestdeal-nginx"

# Step 5: Check host-nginx config
echo ""
echo "=== Step 5: host-nginx Configuration ==="
docker exec host-nginx nginx -t 2>&1 | tail -5

echo ""
echo "Proxy configuration:"
docker exec host-nginx cat /etc/nginx/conf.d/router.conf | grep -A3 "proxy_pass" | head -10

# Step 6: Check ports
echo ""
echo "=== Step 6: Port Status ==="
echo "Port 443:"
ss -tulpn | grep 443 | grep docker-proxy

echo ""
echo "Service nginx ports:"
ss -tulpn | grep -E ":(8444|8445|8085)" | head -5

# Step 7: Test direct access
echo ""
echo "=== Step 7: Test Direct Access ==="
echo "Testing host-nginx directly:"
curl -k -I https://localhost:443 2>&1 | head -5 || echo "✗ Cannot access host-nginx"

echo ""
echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "Common fixes:"
echo "1. Start host-nginx: cd ~/host-nginx && docker-compose up -d"
echo "2. Connect service nginx to network: docker network connect host-network sabito-nginx"
echo "3. Update service nginx ports to internal ports"
echo "4. Restart service nginx containers"
echo ""


