#!/bin/bash

# Complete Fix for Host Nginx Crash

set -e

echo "=========================================="
echo "FIXING HOST NGINX CRASH"
echo "=========================================="
echo ""

# Step 1: Start sabito-nginx
echo "=== Step 1: Start sabito-nginx ==="
if docker ps -a | grep -q sabito-nginx; then
    docker start sabito-nginx
    sleep 3
    echo "✓ sabito-nginx started"
else
    echo "⚠ sabito-nginx container not found - may need to recreate"
fi

# Step 2: Update Best Deal Nginx to Internal Ports
echo ""
echo "=== Step 2: Update Best Deal Nginx Ports ==="
cd ~/bestdeal_shipping

# Backup current config
cp docker-compose.prod.yml docker-compose.prod.yml.backup

# Update ports to internal (8085/8445)
sed -i 's/8080:80/8085:80/g' docker-compose.prod.yml
sed -i 's/8443:443/8445:443/g' docker-compose.prod.yml

echo "✓ Ports updated to 8085/8445"

# Step 3: Restart Best Deal Nginx
echo ""
echo "=== Step 3: Restart Best Deal Nginx ==="
docker-compose -f docker-compose.prod.yml stop nginx
docker-compose -f docker-compose.prod.yml up -d nginx
sleep 3
echo "✓ Best Deal nginx restarted on internal ports"

# Step 4: Connect Containers to Network
echo ""
echo "=== Step 4: Connect Containers to Network ==="
docker network connect host-network sabito-nginx 2>/dev/null && echo "✓ sabito-nginx connected" || echo "⚠ sabito-nginx already connected or error"
docker network connect host-network bestdeal_nginx 2>/dev/null && echo "✓ bestdeal-nginx connected" || echo "⚠ bestdeal-nginx already connected or error"

# Step 5: Update host-nginx config to use correct ports
echo ""
echo "=== Step 5: Update host-nginx Config ==="
cd ~/host-nginx

# Update router.conf to use correct internal ports
# sabito-nginx should be on 8444, bestdeal-nginx on 8445
sed -i 's/sabito-nginx:8444/sabito-nginx:8444/g' conf.d/router.conf
sed -i 's/bestdeal-nginx:8445/bestdeal_nginx:8445/g' conf.d/router.conf

echo "✓ Config updated"

# Step 6: Restart host-nginx
echo ""
echo "=== Step 6: Restart host-nginx ==="
docker-compose restart host-nginx
sleep 5
echo "✓ host-nginx restarted"

# Step 7: Verify Everything
echo ""
echo "=== Step 7: Verify Everything ==="
echo "Container status:"
docker ps | grep -E "host-nginx|sabito-nginx|bestdeal_nginx"

echo ""
echo "Network connectivity:"
docker network inspect host-network | grep -A5 "Containers" | head -15

echo ""
echo "host-nginx logs (last 10 lines):"
docker logs host-nginx --tail 10

echo ""
echo "=== Step 8: Test Routing ==="
echo "Testing Best Deal:"
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -5 || echo "⚠ Still testing..."

echo ""
echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "If issues persist:"
echo "1. Check host-nginx logs: docker logs host-nginx"
echo "2. Check service nginx: docker logs sabito-nginx && docker logs bestdeal_nginx"
echo "3. Verify network: docker network inspect host-network"
echo ""


